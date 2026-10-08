-- Patch: Create notifications table

CREATE TABLE IF NOT EXISTS notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                   VARCHAR(500) NOT NULL,
    message                 TEXT NOT NULL,
    type                    VARCHAR(50) DEFAULT 'info',
    -- info, success, warning, error, emi_due, payment_received, application_status, loan_update
    related_entity_type     VARCHAR(50),
    -- application, loan, emi, payment, penalty, disbursement
    related_entity_id       UUID,
    is_read                 BOOLEAN DEFAULT false,
    is_action_required      BOOLEAN DEFAULT false,
    action_url              VARCHAR(500),
    read_at                 TIMESTAMP,
    expires_at              TIMESTAMP,
    created_at              TIMESTAMP DEFAULT NOW(),

    CHECK (type IN ('info', 'success', 'warning', 'error', 'emi_due', 'payment_received', 'application_status', 'loan_update'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

SELECT 'Notifications table created' AS result;