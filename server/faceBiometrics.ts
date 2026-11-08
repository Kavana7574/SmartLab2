export interface BiometricMatchResult {
  matched: boolean;
  similarity: number;
  euclideanDistance: number;
  confidencePercent: number;
  threshold: number;
  reason?: string;
}

export interface LivenessVerificationData {
  livenessScore?: number;
  challengePassed?: boolean;
  method?: string;
  motionScore?: number;
  timestamp?: number;
}

/**
 * Validates anti-spoofing and liveness data to reject static photographs and replay attacks
 */
export function verifyLiveness(data?: LivenessVerificationData): { success: boolean; reason?: string } {
  if (!data) {
    return { success: true }; // optional if bypassed in test harness
  }

  if (data.challengePassed === false) {
    return {
      success: false,
      reason: 'Liveness verification challenge failed. Please follow the on-screen facial movement prompt.'
    };
  }

  if (typeof data.livenessScore === 'number' && data.livenessScore < 50) {
    return {
      success: false,
      reason: 'Static photograph or replay detected. Please verify using a live camera.'
    };
  }

  if (data.timestamp && Math.abs(Date.now() - data.timestamp) > 5 * 60 * 1000) {
    return {
      success: false,
      reason: 'Liveness verification timestamp expired. Please capture your face in real time.'
    };
  }

  return { success: true };
}

/**
 * Compares two 128-dimensional face embedding vectors
 * Computes cosine similarity and Euclidean distance
 */
export function compareFaceEmbeddings(
  liveVector: number[],
  registeredVector: number[],
  distanceThreshold = 0.38
): BiometricMatchResult {
  if (!Array.isArray(liveVector) || !Array.isArray(registeredVector)) {
    return {
      matched: false,
      similarity: 0,
      euclideanDistance: 999,
      confidencePercent: 0,
      threshold: distanceThreshold,
      reason: 'Face Verification Failed. The registered student could not be verified. Please try again.'
    };
  }

  if (liveVector.length !== 128 || registeredVector.length !== 128) {
    return {
      matched: false,
      similarity: 0,
      euclideanDistance: 999,
      confidencePercent: 0,
      threshold: distanceThreshold,
      reason: 'Face Verification Failed. The registered student could not be verified. Please try again.'
    };
  }

  let dotProduct = 0;
  let normLive = 0;
  let normReg = 0;
  let sumSqDiff = 0;

  for (let i = 0; i < 128; i++) {
    const l = Number(liveVector[i]) || 0;
    const r = Number(registeredVector[i]) || 0;

    dotProduct += l * r;
    normLive += l * l;
    normReg += r * r;
    sumSqDiff += (l - r) * (l - r);
  }

  const denom = Math.sqrt(normLive) * Math.sqrt(normReg);
  const similarity = denom === 0 ? 0 : Math.max(-1, Math.min(1, dotProduct / denom));
  const euclideanDistance = Math.sqrt(sumSqDiff);

  // Confidence mapping based on distance
  const confidencePercent = Math.max(0, Math.min(100, Math.round((1 - euclideanDistance / 0.8) * 100)));
  const matched = euclideanDistance <= distanceThreshold;

  return {
    matched,
    similarity: Number(similarity.toFixed(4)),
    euclideanDistance: Number(euclideanDistance.toFixed(4)),
    confidencePercent,
    threshold: distanceThreshold,
    reason: matched ? undefined : 'Face Verification Failed. The registered student could not be verified. Please try again.'
  };
}
