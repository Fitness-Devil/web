'use client';

import { useMemo, useState } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineNotice } from '@/components/ui/inline-notice';

const GET_USER_VIDEOS = gql`
  query GetUserVideos($userId: String!) {
    getUserVideos(userId: $userId) {
      id
      filename
      contentType
      status
      storageKey
      created_at
      updatedAt
    }
  }
`;

const CREATE_VIDEO_WITH_UPLOAD = gql`
  mutation CreateVideoWithUpload($input: VideoRequest!) {
    createVideoWithUpload(input: $input) {
      video {
        id
        filename
        contentType
        status
        storageKey
        created_at
        updatedAt
      }
      uploadSession {
        uploadUrl
        expiresAt
      }
    }
  }
`;

const UPDATE_VIDEO_STATUS = gql`
  mutation UpdateVideoStatus($videoId: String!, $status: VideoStatus!) {
    updateVideoStatus(videoId: $videoId, status: $status) {
      id
      status
    }
  }
`;

const CREATE_PLAYBACK_SESSION = gql`
  mutation CreatePlaybackSession($videoId: String!) {
    createPlaybackSession(videoId: $videoId) {
      playbackUrl
      expiresAt
    }
  }
`;

const GET_VIDEO_METADATA = gql`
  query GetVideoMetadata($videoId: String!) {
    getVideoMetadata(videoId: $videoId) {
      videoId
      durationMs
      width
      height
      codec
      bitrate
      frameRate
      status
      errorMessage
      analyzedAt
    }
  }
`;

type VideoItem = {
  id: string;
  filename: string;
  contentType: string;
  status: string;
  storageKey: string;
  created_at: string;
  updatedAt: string;
};

type VideoMetadata = {
  videoId: string;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  codec: string | null;
  bitrate: number | null;
  frameRate: number | null;
  status: string;
  errorMessage: string | null;
  analyzedAt: string | null;
};

const contentTypeMap: Record<string, 'MP4' | 'QUICKTIME' | 'WEBM' | null> = {
  'video/mp4': 'MP4',
  'video/quicktime': 'QUICKTIME',
  'video/webm': 'WEBM',
};

export default function VideosPage() {
  const { data: session } = useSession();
  const [notice, setNotice] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const userId = session?.user?.id;

  const { data, loading, refetch } = useQuery<{ getUserVideos: VideoItem[] }>(GET_USER_VIDEOS, {
    variables: { userId },
    skip: !userId,
  });

  const { data: analysisData, loading: analysisLoading } = useQuery<{
    getVideoMetadata: VideoMetadata | null;
  }>(GET_VIDEO_METADATA, {
    variables: { videoId: selectedVideo?.id ?? '' },
    skip: !selectedVideo?.id,
  });

  const [createVideoWithUpload] = useMutation<{
    createVideoWithUpload: {
      video: { id: string };
      uploadSession: { uploadUrl: string };
    };
  }>(CREATE_VIDEO_WITH_UPLOAD, {
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to create upload session: ${error.message}` });
    },
  });

  const [updateVideoStatus] = useMutation(UPDATE_VIDEO_STATUS, {
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to update video status: ${error.message}` });
    },
  });

  const [createPlaybackSession] = useMutation<{
    createPlaybackSession: {
      playbackUrl: string;
    };
  }>(CREATE_PLAYBACK_SESSION, {
    onError: (error) => {
      setNotice({ type: 'error', message: `Failed to start playback: ${error.message}` });
    },
  });

  const videos = useMemo(() => data?.getUserVideos || [], [data]);
  const analysis = analysisData?.getVideoMetadata ?? null;

  const formatDuration = (durationMs: number | null) => {
    if (!durationMs) return '—';
    const totalSeconds = Math.round(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const formatRate = (frameRate: number | null) =>
    frameRate ? `${frameRate.toFixed(2)} fps` : '—';

  const formatBitrate = (bitrate: number | null) => {
    if (!bitrate) return '—';
    const mbps = bitrate / 1_000_000;
    return `${mbps.toFixed(2)} Mbps`;
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      setNotice({ type: 'info', message: 'Select a video file to upload.' });
      return;
    }

    const mappedType = contentTypeMap[selectedFile.type];
    if (!mappedType) {
      setNotice({ type: 'error', message: 'Unsupported file type. Use MP4, MOV, or WebM.' });
      return;
    }

    setIsUploading(true);
    setNotice(null);

    try {
      const { data: uploadData } = await createVideoWithUpload({
        variables: {
          input: {
            userId,
            filename: selectedFile.name,
            contentType: mappedType,
          },
        },
      });

      const uploadUrl = uploadData?.createVideoWithUpload?.uploadSession?.uploadUrl;
      const videoId = uploadData?.createVideoWithUpload?.video?.id;

      if (!uploadUrl || !videoId) {
        throw new Error('Upload session not available.');
      }

      const headers: Record<string, string> = {
        'Content-Type': selectedFile.type,
      };

      if (uploadUrl.includes('blob.core.windows.net') || uploadUrl.includes('127.0.0.1:10000')) {
        headers['x-ms-blob-type'] = 'BlockBlob';
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      await updateVideoStatus({
        variables: {
          videoId,
          status: 'UPLOADED',
        },
      });

      setSelectedFile(null);
      setNotice({ type: 'success', message: 'Video uploaded successfully.' });
      await refetch();
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message || 'Video upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayback = async (video: VideoItem) => {
    setSelectedVideo(video);
    setPlaybackUrl(null);

    try {
      const { data: playbackData } = await createPlaybackSession({
        variables: { videoId: video.id },
      });
      setPlaybackUrl(playbackData?.createPlaybackSession?.playbackUrl || null);
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message || 'Playback failed.' });
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-6xl flex-col gap-6 overflow-hidden">
      {notice ? <InlineNotice message={notice.message} type={notice.type} /> : null}

      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Videos</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Video Analysis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload videos for analysis and review your history.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base text-white">Upload</CardTitle>
            <CardDescription className="text-sm">
              MP4, MOV, or WebM. Max size depends on storage policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : 'No file selected'}
              </div>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || !userId}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base text-white">Playback</CardTitle>
            <CardDescription className="text-sm">
              Select a video to generate a secure playback link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedVideo ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {selectedVideo.filename}
                </div>
                {playbackUrl ? (
                  <div className="rounded-2xl border border-white/10 bg-black">
                    <video
                      controls
                      className="h-48 w-full rounded-2xl object-contain"
                    >
                      <source src={playbackUrl} />
                    </video>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-muted-foreground">
                    Generating playback link...
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-muted-foreground">
                Select a video from the list to preview it here.
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Analysis</div>
              {!selectedVideo ? (
                <div className="mt-3 text-sm text-muted-foreground">
                  Pick a video to view analysis metadata.
                </div>
              ) : analysisLoading ? (
                <div className="mt-3 text-sm text-muted-foreground">Loading analysis...</div>
              ) : analysis ? (
                <div className="mt-4 grid gap-3 text-sm text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span>{analysis.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{formatDuration(analysis.durationMs)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Resolution</span>
                    <span>
                      {analysis.width && analysis.height
                        ? `${analysis.width}×${analysis.height}`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Codec</span>
                    <span>{analysis.codec ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Frame rate</span>
                    <span>{formatRate(analysis.frameRate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bitrate</span>
                    <span>{formatBitrate(analysis.bitrate)}</span>
                  </div>
                  {analysis.analyzedAt ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Analyzed</span>
                      <span>{new Date(analysis.analyzedAt).toLocaleString()}</span>
                    </div>
                  ) : null}
                  {analysis.errorMessage ? (
                    <div className="rounded-xl border border-amber-200/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                      {analysis.errorMessage}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">
                  Analysis is not available yet. Check back soon.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden border-white/10 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">Your Videos</CardTitle>
          <CardDescription className="text-sm">{videos.length} videos</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
          <div className="hidden grid-cols-[2fr_1fr_1fr_0.8fr] items-center gap-4 border-b border-white/10 pb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground md:grid">
            <span>Filename</span>
            <span>Status</span>
            <span>Created</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="flex-1 divide-y divide-white/10 overflow-y-auto pr-2 scrollbar-dark">
            {loading ? (
              <div className="py-6 text-sm text-muted-foreground">Loading videos...</div>
            ) : videos.length === 0 ? (
              <div className="py-6 text-sm text-muted-foreground">No videos uploaded yet.</div>
            ) : (
              videos.map((video) => (
                <div
                  key={video.id}
                  className="grid gap-3 py-4 md:grid-cols-[2fr_1fr_1fr_0.8fr] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{video.filename}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{video.contentType}</p>
                  </div>
                  <div className="text-sm text-white">{video.status}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(video.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 bg-white/5 text-white"
                      onClick={() => handlePlayback(video)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
