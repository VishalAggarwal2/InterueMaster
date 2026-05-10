package com.intervai.service;

import com.intervai.dto.response.RecordingResponse;
import com.intervai.entity.Answer;
import com.intervai.entity.Recording;
import com.intervai.entity.Session;
import com.intervai.entity.User;
import com.intervai.exception.ResourceNotFoundException;
import com.intervai.repository.AnswerRepository;
import com.intervai.repository.RecordingRepository;
import com.intervai.repository.SessionRepository;
import com.intervai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecordingService {

    private final RecordingRepository recordingRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AnswerRepository answerRepository;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${aws.cloudfront.domain:}")
    private String cloudfrontDomain;

    @Value("${app.free-tier.recording-retention-days}")
    private int retentionDays;

    @Transactional
    public RecordingResponse generateUploadUrl(String email, UUID sessionId, UUID answerId, String mimeType) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        String s3Key = buildS3Key(user.getId(), sessionId, answerId);

        String presignedUrl = null;
        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(mimeType != null ? mimeType : "video/webm")
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .putObjectRequest(putRequest)
                    .build();

            presignedUrl = s3Presigner.presignPutObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.warn("Could not generate presigned URL (AWS not configured): {}", e.getMessage());
            presignedUrl = "https://placeholder-aws-not-configured.example.com/" + s3Key;
        }

        Answer answer = null;
        if (answerId != null) {
            answer = answerRepository.findById(answerId).orElse(null);
        }

        OffsetDateTime expiresAt = "FREE".equals(user.getPlan())
                ? OffsetDateTime.now().plusDays(retentionDays)
                : null;

        Recording recording = Recording.builder()
                .session(session)
                .user(user)
                .answer(answer)
                .s3Key(s3Key)
                .s3Bucket(bucketName)
                .mimeType(mimeType != null ? mimeType : "video/webm")
                .recordingType(mimeType != null && mimeType.startsWith("audio") ? "AUDIO" : "VIDEO")
                .status("PENDING")
                .expiresAt(expiresAt)
                .build();

        recording = recordingRepository.save(recording);

        return RecordingResponse.builder()
                .id(recording.getId())
                .sessionId(sessionId)
                .answerId(answerId)
                .presignedUploadUrl(presignedUrl)
                .s3Key(s3Key)
                .mimeType(recording.getMimeType())
                .recordingType(recording.getRecordingType())
                .status(recording.getStatus())
                .expiresAt(recording.getExpiresAt())
                .createdAt(recording.getCreatedAt())
                .build();
    }

    @Transactional
    public RecordingResponse confirmUpload(String email, UUID recordingId, Long fileSizeBytes, Integer durationSeconds) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Recording recording = recordingRepository.findById(recordingId)
                .orElseThrow(() -> new ResourceNotFoundException("Recording", "id", recordingId));

        if (!recording.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Recording does not belong to the user");
        }

        recording.setStatus("UPLOADED");
        recording.setFileSizeBytes(fileSizeBytes);
        recording.setDurationSeconds(durationSeconds);

        // Build CloudFront URL if configured
        if (cloudfrontDomain != null && !cloudfrontDomain.isBlank()) {
            recording.setCloudfrontUrl("https://" + cloudfrontDomain + "/" + recording.getS3Key());
        }

        recording = recordingRepository.save(recording);
        return mapToResponse(recording, null);
    }

    @Transactional(readOnly = true)
    public String getDownloadUrl(String email, UUID recordingId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Recording recording = recordingRepository.findById(recordingId)
                .orElseThrow(() -> new ResourceNotFoundException("Recording", "id", recordingId));

        if (!recording.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Recording does not belong to the user");
        }

        if (recording.getCloudfrontUrl() != null) {
            return recording.getCloudfrontUrl();
        }

        try {
            GetObjectRequest getRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(recording.getS3Key())
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(1))
                    .getObjectRequest(getRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        } catch (Exception e) {
            log.warn("Could not generate download URL: {}", e.getMessage());
            return null;
        }
    }

    @Transactional(readOnly = true)
    public List<RecordingResponse> getSessionRecordings(String email, UUID sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));

        return recordingRepository.findBySessionOrderByCreatedAtDesc(session)
                .stream().map(r -> mapToResponse(r, null)).collect(Collectors.toList());
    }

    private String buildS3Key(UUID userId, UUID sessionId, UUID answerId) {
        String base = String.format("recordings/%s/%s/", userId, sessionId);
        if (answerId != null) {
            return base + answerId + "_" + System.currentTimeMillis() + ".webm";
        }
        return base + "full_session_" + System.currentTimeMillis() + ".webm";
    }

    private RecordingResponse mapToResponse(Recording recording, String downloadUrl) {
        return RecordingResponse.builder()
                .id(recording.getId())
                .sessionId(recording.getSession().getId())
                .answerId(recording.getAnswer() != null ? recording.getAnswer().getId() : null)
                .cloudfrontUrl(recording.getCloudfrontUrl())
                .presignedDownloadUrl(downloadUrl)
                .s3Key(recording.getS3Key())
                .fileSizeBytes(recording.getFileSizeBytes())
                .durationSeconds(recording.getDurationSeconds())
                .mimeType(recording.getMimeType())
                .recordingType(recording.getRecordingType())
                .status(recording.getStatus())
                .expiresAt(recording.getExpiresAt())
                .createdAt(recording.getCreatedAt())
                .build();
    }
}
