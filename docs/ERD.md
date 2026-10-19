# ERD

```mermaid
erDiagram
  UNIVERSITY ||--o{ USER : enrolls
  UNIVERSITY ||--o{ COURSE : teaches
  UNIVERSITY ||--o{ MAJOR : has_major
  UNIVERSITY ||--o{ MINOR : has_minor
  UNIVERSITY ||--o{ HOUSING : has_housing
  UNIVERSITY ||--o{ FOOD_PLACE : has_food
  DEPARTMENT ||--o{ COURSE : has
  DEPARTMENT ||--o{ MAJOR : has
  DEPARTMENT ||--o{ MINOR : has
  MAJOR ||--o{ MAJOR_REQUIREMENT : needs
  COURSE ||--o{ MAJOR_REQUIREMENT : counts_for
  MINOR ||--o{ MINOR_REQUIREMENT : needs
  COURSE ||--o{ MINOR_REQUIREMENT : counts_for
  COURSE ||--o{ PREREQUISITE : requires
  COURSE ||--o{ PREREQUISITE : required_by
  USER ||--|| PROFILE : has
  USER ||--o| ROOMMATE_PREFERENCE : sets
  USER ||--o{ REVIEW : writes
  HOUSING |o--o| MAP_TACK : pin
  FOOD_PLACE |o--o| MAP_TACK : pin
  HOUSING |o--o{ REVIEW : rated
  FOOD_PLACE |o--o{ REVIEW : rated
  MAJOR |o--o{ REVIEW : rated
  MINOR |o--o{ REVIEW : rated

  UNIVERSITY {
    int university_id PK
    string name
    string email_domain
    string city
    string state
  }
  USER {
    int user_id PK
    int university_id FK
    string email
    string password_hash
    string display_name
    timestamp created_at
  }
  PROFILE {
    int profile_id PK
    int user_id FK
    string bio
    string interests
    int graduation_year
  }
  ROOMMATE_PREFERENCE {
    int preference_id PK
    int user_id FK
    int budget_max
    string sleep_schedule
    string cleanliness
    boolean pets_ok
    boolean smoking_ok
  }
  DEPARTMENT {
    string alpha_code PK
    string department_name
  }
  COURSE {
    uuid course_id PK
    int university_id FK
    string alpha_code FK
    string numeric_code
    string title
    string description
    int credit_hours
  }
  MAJOR {
    uuid major_id PK
    int university_id FK
    string alpha_code FK
    string title
    string description
    string type
  }
  MINOR {
    uuid minor_id PK
    int university_id FK
    string alpha_code FK
    string title
    string description
  }
  MAJOR_REQUIREMENT {
    uuid major_id PK, FK
    uuid course_id PK, FK
  }
  MINOR_REQUIREMENT {
    uuid minor_id PK, FK
    uuid course_id PK, FK
  }
  PREREQUISITE {
    uuid course_id PK, FK
    uuid required_course_id PK, FK
  }
  HOUSING {
    int housing_id PK
    int university_id FK
    string name
    string address
    int monthly_rent
    float crime_score
    float noise_score
  }
  FOOD_PLACE {
    int food_place_id PK
    int university_id FK
    string name
    string type
    string address
  }
  MAP_TACK {
    int tack_id PK
    int housing_id FK
    int food_place_id FK
    float latitude
    float longitude
  }
  REVIEW {
    int review_id PK
    int user_id FK
    int housing_id FK
    int food_place_id FK
    uuid major_id FK
    uuid minor_id FK
    int rating
    string comment
    timestamp created_at
  }
```
