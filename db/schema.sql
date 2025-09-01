CREATE DATABASE IF NOT EXISTS pms_db;
USE pms_db;

-- ================= DEPARTMENTS =================
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= TEAMS =================
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  leader_id INT NULL,
  manager_id INT NULL,
  members INT DEFAULT 0,
  department_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ================= USERS =================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  jobTitle VARCHAR(255),
  level VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  department_id INT,  -- now FK, not a string
  team_id INT,
  phone VARCHAR(20),
  address TEXT,
  emergencyContact VARCHAR(255),
  salary DECIMAL(10,2),
  profileImage VARCHAR(255),
  role ENUM('admin','team_manager','team_leader','staff') DEFAULT 'staff',
  dateRegistered DATE,
  status ENUM('active','inactive') DEFAULT 'active',
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- ================= EVALUATION FORMS =================
CREATE TABLE IF NOT EXISTS evaluation_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  formType ENUM('self_assessment','peer_evaluation') NOT NULL DEFAULT 'peer_evaluation',
  targetEvaluator VARCHAR(50) NOT NULL DEFAULT 'peer',
  weight INT NOT NULL DEFAULT 100,
  sections JSON NOT NULL,
  ratingScale JSON NOT NULL,
  team_id INT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastModified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  usageCount INT NOT NULL DEFAULT 0,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ================= EVALUATIONS =================
CREATE TABLE IF NOT EXISTS evaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  evaluator_id INT,
  form_id INT NOT NULL,
  score JSON,
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (form_id) REFERENCES evaluation_forms(id) ON DELETE CASCADE
);

-- ================= REPORTS =================
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSON
);

-- ================= PERMISSIONS =================
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('admin','team_manager','team_leader','staff') NOT NULL,
  can_manage_teams BOOLEAN DEFAULT FALSE,
  can_create_forms BOOLEAN DEFAULT FALSE,
  can_evaluate BOOLEAN DEFAULT FALSE
);
