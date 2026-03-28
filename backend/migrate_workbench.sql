-- ============================================================
-- Kairo PM — MySQL Migration
-- Run this in MySQL Workbench against your project database.
-- Safe to run multiple times (uses IF NOT EXISTS / column checks).
-- ============================================================

-- 1. Add new columns to the task table
-- (MySQL doesn't support IF NOT EXISTS for columns,
--  so each ALTER is wrapped in a stored procedure that checks first)

DROP PROCEDURE IF EXISTS kairo_migrate;

DELIMITER $$

CREATE PROCEDURE kairo_migrate()
BEGIN

  -- ── task table: new columns ──────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'task' AND column_name = 'priority'
  ) THEN
    ALTER TABLE task ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'task' AND column_name = 'task_type'
  ) THEN
    ALTER TABLE task ADD COLUMN task_type VARCHAR(20) DEFAULT 'task';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'task' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE task ADD COLUMN start_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'task' AND column_name = 'sprint_id'
  ) THEN
    ALTER TABLE task ADD COLUMN sprint_id INT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'task' AND column_name = 'milestone_id'
  ) THEN
    ALTER TABLE task ADD COLUMN milestone_id INT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'task' AND column_name = 'parent_task_id'
  ) THEN
    ALTER TABLE task ADD COLUMN parent_task_id INT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'task' AND column_name = 'recurrence'
  ) THEN
    ALTER TABLE task ADD COLUMN recurrence VARCHAR(50);
  END IF;

  -- ── sprint table ─────────────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'sprint'
  ) THEN
    CREATE TABLE sprint (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      project_id  INT NOT NULL,
      name        VARCHAR(255) NOT NULL,
      goal        TEXT,
      start_date  DATE,
      end_date    DATE,
      status      VARCHAR(50) DEFAULT 'planning',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

  -- ── milestone table ──────────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'milestone'
  ) THEN
    CREATE TABLE milestone (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      project_id  INT NOT NULL,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      due_date    DATE,
      status      VARCHAR(50) DEFAULT 'pending',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

  -- ── Add FK constraints to task.sprint_id and task.milestone_id ───────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'task' AND CONSTRAINT_NAME = 'fk_task_sprint'
  ) THEN
    ALTER TABLE task ADD CONSTRAINT fk_task_sprint
      FOREIGN KEY (sprint_id) REFERENCES sprint(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'task' AND CONSTRAINT_NAME = 'fk_task_milestone'
  ) THEN
    ALTER TABLE task ADD CONSTRAINT fk_task_milestone
      FOREIGN KEY (milestone_id) REFERENCES milestone(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'task' AND CONSTRAINT_NAME = 'fk_task_parent'
  ) THEN
    ALTER TABLE task ADD CONSTRAINT fk_task_parent
      FOREIGN KEY (parent_task_id) REFERENCES task(id) ON DELETE SET NULL;
  END IF;

  -- ── subtask table ────────────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'subtask'
  ) THEN
    CREATE TABLE subtask (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      task_id     INT NOT NULL,
      title       VARCHAR(500) NOT NULL,
      done        TINYINT(1) DEFAULT 0,
      `order`     INT DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

  -- ── comment table ────────────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'comment'
  ) THEN
    CREATE TABLE comment (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      project_id      INT NOT NULL,
      task_id         INT,
      idea_id         INT,
      author_user_id  VARCHAR(191) NOT NULL,
      author_name     VARCHAR(255),
      text            LONGTEXT NOT NULL,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id)    REFERENCES task(id)    ON DELETE CASCADE,
      FOREIGN KEY (idea_id)    REFERENCES idea(id)    ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

  -- ── taskhistory table ────────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'taskhistory'
  ) THEN
    CREATE TABLE taskhistory (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      task_id     INT NOT NULL,
      field       VARCHAR(100) NOT NULL,
      old_value   TEXT,
      new_value   TEXT,
      changed_by  VARCHAR(191) NOT NULL,
      changed_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

  -- ── taskattachment table ─────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'taskattachment'
  ) THEN
    CREATE TABLE taskattachment (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      task_id     INT NOT NULL,
      file_name   VARCHAR(500) NOT NULL,
      file_url    TEXT NOT NULL,
      uploaded_by VARCHAR(191) NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

  -- ── meetingnote table ────────────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'meetingnote'
  ) THEN
    CREATE TABLE meetingnote (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      project_id  INT NOT NULL,
      raw_text    LONGTEXT NOT NULL,
      summary     TEXT,
      meeting_date DATE,
      insights    JSON,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'meetingnote'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'meetingnote' AND column_name = 'insights'
  ) THEN
    ALTER TABLE meetingnote ADD COLUMN insights JSON;
  END IF;

  -- ── inappnotification table ──────────────────────────────────────────────

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'inappnotification'
  ) THEN
    CREATE TABLE inappnotification (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     VARCHAR(191) NOT NULL,
      type        VARCHAR(100) NOT NULL,
      payload     JSON,
      `read`      TINYINT(1) DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notif_user (user_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  END IF;

END$$

DELIMITER ;

-- Run the migration
CALL kairo_migrate();

-- Clean up
DROP PROCEDURE IF EXISTS kairo_migrate;

SELECT 'Migration complete!' AS result;
