from dataclasses import dataclass

@dataclass
class ViolationEvent:
    type: str
    severity: str
    confidence: float
    description: str
    metadata: dict

RULES = [
    (lambda r: not r.face_present, "no_face", "high", 25, "No face detected in frame"),
    (lambda r: r.face_count > 1, "multiple_faces", "severe", 40, "Multiple faces detected"),
    (lambda r: r.phone_detected, "phone_detected", "severe", 45, "Mobile phone detected"),
    (lambda r: r.person_count > 1, "multiple_persons", "severe", 40, "Multiple persons detected"),
    (lambda r: r.gaze_direction in ("left", "right") if r.gaze_direction else False, "gaze_away", "medium", 15, "Gaze away from screen"),
    (lambda r: r.head_pose is not None and abs(r.head_pose.get("yaw", 0)) > 25, "head_turned", "medium", 15, "Head turned significantly"),
]

class SuspicionEngine:
    def __init__(self, decay_rate: float = 0.95):
        self._running_score: float = 0.0
        self._decay = decay_rate
        self._violation_counts: dict = {}

    def evaluate(self, result):
        violations = []
        frame_score = 0.0

        for condition, v_type, severity, base_pts, desc in RULES:
            if condition(result):
                self._violation_counts[v_type] = self._violation_counts.get(v_type, 0) + 1
                escalation = min(self._violation_counts[v_type] * 0.1, 0.5)
                pts = base_pts * (1 + escalation)
                frame_score += pts
                violations.append(ViolationEvent(
                    type=v_type,
                    severity=severity,
                    confidence=min(0.6 + escalation, 0.99),
                    description=desc,
                    metadata={},
                ))
            else:
                self._violation_counts[v_type] = 0

        self._running_score = (self._running_score * self._decay) + frame_score
        score = min(max(self._running_score, 0), 100)
        risk = "severe" if score >= 70 else "high" if score >= 45 else "medium" if score >= 20 else "low"
        return round(score, 2), risk, violations
