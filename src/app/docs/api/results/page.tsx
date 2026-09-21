import Link from 'next/link';
import { DocsShell } from '@/components/docs/docs-shell';
import { DocCallout, DocCodeBlock, DocSection, DocTable } from '@/components/docs/doc-blocks';
import { apiNav } from '@/lib/docs/navigation';

const pre = 'overflow-x-auto rounded-lg border border-warm-card-border bg-warm-card p-4 text-xs leading-relaxed text-warm-cream';

export default function ApiResultsPage() {
  return (
    <DocsShell
      title="Results & Exams"
      subtitle="Exam hierarchy, marks entry, grade computation, and report card publication."
      nav={apiNav}
      variant="api"
    >
      <h2>Overview</h2>
      <p>
        The exam system manages the complete lifecycle from exam definition through marks entry to
        report card publication. It follows a hierarchical structure: ExamType → ExamSession →
        MarksEntry → SubjectResult → ReportCard.
      </p>

      <pre className={pre}>
{`flowchart TD
  A[ExamType] --> B[ExamSession]
  B --> C[MarksEntry]
  C --> D[SubjectResult]
  D --> E[ReportCard]

  F[GradeScale] --> D
  G[Subject] --> C
  H[Student] --> C`}
      </pre>

      <DocSection title="Exam hierarchy">
        <DocTable
          headers={['Model', 'Description', 'Key fields']}
          rows={[
            ['ExamType', 'Category definition (Midterm, Final, Quiz)', 'name, code, weightage'],
            ['ExamSession', 'Instance of an exam type for a class', 'examTypeId, groupId, startDate, endDate'],
            ['MarksEntry', 'Student marks for a subject in a session', 'examSessionId, studentId, subjectId, marks, enteredBy'],
            ['SubjectResult', 'Computed result per subject', 'totalMarks, obtainedMarks, percentage, grade'],
            ['ReportCard', 'Final report card for a student', 'status (DRAFT/PUBLISHED), totalMarks, percentage, rank'],
          ]}
        />

        <h3>ExamType</h3>
        <DocCodeBlock>{`// ExamType — defines exam categories
{
  "id": "et-uuid",
  "name": "Midterm Examination",
  "code": "MIDTERM",
  "weightage": 30,       // percentage weight in final grade
  "isActive": true
}`}</DocCodeBlock>

        <h3>ExamSession</h3>
        <DocCodeBlock>{`// ExamSession — instance for a class
{
  "id": "es-uuid",
  "examTypeId": "et-uuid",
  "groupId": "group-uuid",       // class
  "academicYearId": "ay-uuid",
  "startDate": "2026-03-15",
  "endDate": "2026-03-25",
  "status": "OPEN"               // OPEN, CLOSED, GRADED
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Marks entry">
        <p>
          Teachers enter marks per student per subject. Each MarksEntry records the student, subject,
          marks obtained, and the teacher who entered the marks (enteredBy).
        </p>
        <DocCodeBlock>{`// MarksEntry — per student per subject
{
  "id": "me-uuid",
  "examSessionId": "es-uuid",
  "studentId": "student-uuid",
  "subjectId": "subject-uuid",
  "marks": 85,                    // null = absent
  "totalMarks": 100,
  "enteredBy": "teacher-uuid",
  "enteredAt": "2026-03-20T10:00:00Z"
}`}</DocCodeBlock>

        <h3>Absent handling</h3>
        <p>
          When a student is absent, <code>marks</code> is set to <code>null</code>. This is distinct
          from a zero score. The UI displays "Absent" for null marks and "0" for zero marks.
        </p>
        <DocCallout variant="info" title="Absent vs zero">
          <code>marks = null</code> → Student was absent, not counted in totals.
          <br />
          <code>marks = 0</code> → Student was present but scored zero.
        </DocCallout>
      </DocSection>

      <DocSection title="Subject results">
        <p>
          Subject results are computed after marks entry is closed for a session. The system calculates
          total marks, obtained marks, percentage, and applies the grade scale.
        </p>
        <DocCodeBlock>{`// SubjectResult — computed per subject
{
  "id": "sr-uuid",
  "examSessionId": "es-uuid",
  "studentId": "student-uuid",
  "subjectId": "subject-uuid",
  "totalMarks": 100,
  "obtainedMarks": 85,
  "percentage": 85.00,
  "grade": "A",
  "gradePoint": 4.0
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Grade scales">
        <p>
          Grade scales define the mapping between marks ranges and letter grades. Multiple scales can
          exist per branch.
        </p>
        <DocTable
          headers={['Grade', 'Min %', 'Max %', 'Grade Point']}
          rows={[
            ['A+', '90', '100', '4.0'],
            ['A', '80', '89.99', '3.7'],
            ['B+', '70', '79.99', '3.3'],
            ['B', '60', '69.99', '3.0'],
            ['C', '50', '59.99', '2.0'],
            ['D', '40', '49.99', '1.0'],
            ['F', '0', '39.99', '0.0'],
          ]}
        />
        <DocCodeBlock>{`// GradeScale definition
{
  "id": "gs-uuid",
  "branchId": "branch-uuid",
  "name": "Standard Scale",
  "bands": [
    { "grade": "A+", "minPercentage": 90, "gradePoint": 4.0 },
    { "grade": "A",  "minPercentage": 80, "gradePoint": 3.7 },
    ...
  ]
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Report cards">
        <h3>Workflow</h3>
        <pre className={pre}>
{`DRAFT ──> PUBLISHED
  │
  └──> ARCHIVED (after new session)`}
        </pre>

        <p>
          Report cards aggregate all subject results for a student in an exam session. They include
          total marks, percentage, rank, and grade. Status transitions from DRAFT to PUBLISHED.
        </p>
        <DocCodeBlock>{`// ReportCard structure
{
  "id": "rc-uuid",
  "studentId": "student-uuid",
  "examSessionId": "es-uuid",
  "status": "PUBLISHED",
  "totalMarks": 500,
  "obtainedMarks": 425,
  "percentage": 85.00,
  "grade": "A",
  "rank": 3,
  "publishedAt": "2026-04-01T09:00:00Z",
  "subjectResults": [
    { "subject": "Mathematics", "marks": 92, "grade": "A+" },
    { "subject": "English", "marks": 85, "grade": "A" },
    ...
  ]
}`}</DocCodeBlock>

        <h3>Publishing</h3>
        <DocCodeBlock>{`// POST /admin/exam-sessions/:sessionId/publish
{
  "publish": true
}

// Backend performs:
// 1. Validate all marks entries are complete
// 2. Compute SubjectResults for each student/subject
// 3. Compute ReportCard totals, percentages, ranks
// 4. Apply GradeScale to determine grades
// 5. Set status to PUBLISHED
// 6. Send notifications to students`}</DocCodeBlock>
      </DocSection>

      <DocSection title="Teacher marks grid">
        <p>
          Teachers access a grid view for entering marks. The endpoint returns all students in a class
          with their current marks for the selected exam session and subject.
        </p>
        <DocCodeBlock>{`GET /teacher/marks/grid/:examSessionId?subjectId=...

Response 200:
{
  "success": true,
  "data": {
    "examSession": { "id": "...", "name": "Midterm" },
    "subject": { "id": "...", "name": "Mathematics" },
    "totalMarks": 100,
    "students": [
      {
        "studentId": "uuid",
        "name": "Ahmad Khan",
        "marks": 85,
        "status": "present"
      },
      {
        "studentId": "uuid",
        "name": "Sara Ali",
        "marks": null,
        "status": "absent"
      }
    ]
  }
}`}</DocCodeBlock>

        <h3>Marks submission</h3>
        <DocCodeBlock>{`POST /teacher/marks/grid/:examSessionId
Content-Type: application/json

{
  "subjectId": "subject-uuid",
  "marks": [
    { "studentId": "uuid-1", "marks": 85 },
    { "studentId": "uuid-2", "marks": null }  // absent
  ]
}`}</DocCodeBlock>
      </DocSection>

      <DocSection title="HOD department overview">
        <p>
          Heads of Department can view an overview of all subjects in their department, including
          marks entry status and subject-wise performance.
        </p>
        <DocCodeBlock>{`GET /teacher/hod/overview?examSessionId=...

Response 200:
{
  "success": true,
  "data": {
    "subjects": [
      {
        "subjectId": "uuid",
        "name": "Mathematics",
        "totalStudents": 45,
        "marksEntered": 42,
        "averageMarks": 78.5,
        "status": "in_progress"
      },
      ...
    ]
  }
}`}</DocCodeBlock>
      </DocSection>

      <DocCallout variant="tip" title="Marks entry lock">
        Once an exam session status changes to GRADED or PUBLISHED, marks entry is locked. Teachers
        cannot modify marks after this point. Admins can unlock if needed.
      </DocCallout>

      <p>
        Next: <Link href="/docs/api/attendance">Attendance</Link> ·{' '}
        <Link href="/docs/api/database">Database</Link>
      </p>
    </DocsShell>
  );
}
