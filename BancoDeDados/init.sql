-- Initialize AATX database schema

CREATE TABLE IF NOT EXISTS users (
    uuid VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
    chat_id VARCHAR(36) PRIMARY KEY,
    user1_uuid VARCHAR(36) NOT NULL,
    user2_uuid VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
    FOREIGN KEY (user2_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
    INDEX idx_user1 (user1_uuid),
    INDEX idx_user2 (user2_uuid)
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id VARCHAR(36) NOT NULL,
    from_uuid VARCHAR(36) NOT NULL,
    to_uuid VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (from_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
    FOREIGN KEY (to_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
    INDEX idx_chat (chat_id),
    INDEX idx_created (created_at)
);
