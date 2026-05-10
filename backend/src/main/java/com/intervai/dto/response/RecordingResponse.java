package com.intervai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordingResponse {

    private UUID id;
    private UUID sessionId;
    private UUID answerId;
    private String presignedUploadUrl;
    private String presignedDownloadUrl;
    private String cloudfrontUrl;
    private String s3Key;
    private Long fileSizeBytes;
    private Integer durationSeconds;
    private String mimeType;
    private String recordingType;
    private String status;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
}
