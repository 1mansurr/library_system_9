CREATE TABLE colleges (
    college_id UUID PRIMARY KEY,
    name       TEXT UNIQUE NOT NULL
);

CREATE TABLE departments (
    department_id UUID PRIMARY KEY,
    college_id    UUID NOT NULL REFERENCES colleges(college_id),
    name          TEXT NOT NULL,
    shelf_prefix  TEXT NOT NULL,
    UNIQUE (college_id, name)
);

CREATE TABLE courses_of_study (
    course_id     UUID PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES departments(department_id),
    name          TEXT NOT NULL,
    UNIQUE (department_id, name)
);

ALTER TABLE books ADD COLUMN course_id UUID REFERENCES courses_of_study(course_id);
ALTER TABLE books DROP COLUMN category;

ALTER TABLE book_copies ADD COLUMN format TEXT NOT NULL DEFAULT 'HARDCOPY' CHECK (format IN ('HARDCOPY','SOFTCOPY'));

-- Seed a representative (not exhaustive) set of real KNUST colleges, departments and courses of study.
INSERT INTO colleges (college_id, name) VALUES
  ('f25218f6-bafb-4a59-af9b-9d00c627dedd', 'College of Science'),
  ('37129eb2-6353-4802-be18-f2772221eb37', 'College of Engineering'),
  ('e150f939-48c5-4685-a5d0-13717491718c', 'College of Art and Built Environment'),
  ('bf92dad8-7ac8-4349-a031-f6519f0ad915', 'College of Agriculture and Natural Resources'),
  ('b6262e03-15ac-426c-9933-7a3ce9a84994', 'College of Health Sciences'),
  ('428a4649-634f-4baa-b786-c9fbe07696fa', 'College of Humanities and Social Sciences');

INSERT INTO departments (department_id, college_id, name, shelf_prefix) VALUES
  ('89ed20c2-2634-40fe-b6cb-bce5b792d3d1', 'f25218f6-bafb-4a59-af9b-9d00c627dedd', 'Department of Computer Science', 'CSC'),
  ('79bdcb60-fbd8-4ffd-ac5b-4f0aad0226aa', 'f25218f6-bafb-4a59-af9b-9d00c627dedd', 'Department of Mathematics', 'MATH'),
  ('e02ad78d-7ba7-47b3-abbe-86f7a4bf5391', 'f25218f6-bafb-4a59-af9b-9d00c627dedd', 'Department of Biochemistry and Biotechnology', 'BIOC'),
  ('bbb5e53d-4306-4004-a163-e8488c12d1f0', '37129eb2-6353-4802-be18-f2772221eb37', 'Department of Computer Engineering', 'CPE'),
  ('a69c2195-7157-49b0-8039-4d3ab0cd1f79', '37129eb2-6353-4802-be18-f2772221eb37', 'Department of Electrical/Electronic Engineering', 'EE'),
  ('11fb8dcd-345f-45c4-a656-2d8e5fc986b9', '37129eb2-6353-4802-be18-f2772221eb37', 'Department of Civil Engineering', 'CE'),
  ('44c9c4e4-187f-47a9-bf2a-58cc25a5e696', 'e150f939-48c5-4685-a5d0-13717491718c', 'Department of Architecture', 'ARC'),
  ('d7f75615-3ee6-4817-8b24-cdaae73ebfe7', 'e150f939-48c5-4685-a5d0-13717491718c', 'Department of Land Economy', 'LE'),
  ('58602be1-3f37-4fca-a844-98969481cc56', 'bf92dad8-7ac8-4349-a031-f6519f0ad915', 'Department of Agricultural Economics, Agribusiness and Extension', 'AGE'),
  ('9f898eee-8c52-45cb-810c-7293e9c9d007', 'bf92dad8-7ac8-4349-a031-f6519f0ad915', 'Department of Crop and Soil Sciences', 'CSS'),
  ('cef95677-ba63-4d5b-a06a-ae6538ed2039', 'b6262e03-15ac-426c-9933-7a3ce9a84994', 'Department of Medicine', 'MED'),
  ('8feac9d5-531b-4e99-b787-4ba206012a37', 'b6262e03-15ac-426c-9933-7a3ce9a84994', 'Department of Pharmacy Practice', 'PHARM'),
  ('fd31c0da-77fe-4db1-b2ef-2f7fc495d546', '428a4649-634f-4baa-b786-c9fbe07696fa', 'Department of Economics', 'ECON'),
  ('3a5c326d-24c1-4b68-973e-f8cefaa9a6d2', '428a4649-634f-4baa-b786-c9fbe07696fa', 'Department of English', 'ENG');

INSERT INTO courses_of_study (course_id, department_id, name) VALUES
  ('d9b0d1a6-915d-428d-a1e7-664741ad4570', '89ed20c2-2634-40fe-b6cb-bce5b792d3d1', 'BSc. Computer Science'),
  ('ccb61976-8392-45e4-bdfc-7f059c5aef58', '79bdcb60-fbd8-4ffd-ac5b-4f0aad0226aa', 'BSc. Mathematics'),
  ('aa452717-1515-423a-b040-e717fe09c41a', 'e02ad78d-7ba7-47b3-abbe-86f7a4bf5391', 'BSc. Biochemistry'),
  ('4e8621af-ca7f-49cd-a730-b48e521b0da2', 'bbb5e53d-4306-4004-a163-e8488c12d1f0', 'BSc. Computer Engineering'),
  ('056e9b1a-e01a-4e24-b455-f077c26f943a', 'a69c2195-7157-49b0-8039-4d3ab0cd1f79', 'BSc. Electrical/Electronic Engineering'),
  ('e6bc376a-f6ed-46eb-a3a5-b5b61c5a9f52', '11fb8dcd-345f-45c4-a656-2d8e5fc986b9', 'BSc. Civil Engineering'),
  ('52989d02-7020-42df-8eed-a1dd332082d2', '44c9c4e4-187f-47a9-bf2a-58cc25a5e696', 'BSc. Architecture'),
  ('16bd98b4-4190-4ff9-9940-0fc3dde3ea38', 'd7f75615-3ee6-4817-8b24-cdaae73ebfe7', 'BSc. Land Economy'),
  ('e983e732-5592-49e4-aefa-6ea4c8b26c57', '58602be1-3f37-4fca-a844-98969481cc56', 'BSc. Agribusiness Management'),
  ('e4ac9de9-05c3-4d11-9568-30964799a5d4', '9f898eee-8c52-45cb-810c-7293e9c9d007', 'BSc. Agriculture'),
  ('f10472e2-839d-4ef2-a23e-78de623020f7', 'cef95677-ba63-4d5b-a06a-ae6538ed2039', 'Doctor of Medicine (MD)'),
  ('d64d65d5-5f5c-4fe5-872f-2334bbfbb6ed', '8feac9d5-531b-4e99-b787-4ba206012a37', 'BPharm'),
  ('494400b7-05af-4866-b658-bdfd21087e88', 'fd31c0da-77fe-4db1-b2ef-2f7fc495d546', 'BA Economics'),
  ('4de4c419-e396-4a36-a2e3-f3eaad5ddb26', '3a5c326d-24c1-4b68-973e-f8cefaa9a6d2', 'BA English');
