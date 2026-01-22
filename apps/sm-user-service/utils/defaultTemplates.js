/**
 * Default email templates used as fallback when no custom template exists
 */

const getWelcomeTemplate = (data) => {
    const { student, parent, school, refNo } = data;
    const recipientName = student?.firstName || parent?.father?.name || parent?.mother?.name || '';

    return {
        subject: `Welcome to ${school?.name || 'Our School'}!`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; margin-bottom: 100px;">
        <h2 style="color: #4A148C;">Welcome to <span style="color: #D81B60;">${school?.name || 'Our School'}</span>!</h2>
        
        <p>Dear <strong>${recipientName}</strong>,</p>
        
        <p>Thank you for registering with <strong>${school?.name || 'our school'}</strong>.</p>
        
        ${refNo ? `<p>Your registration number is 
          <span style="background-color: #E1BEE7; padding: 4px 8px; border-radius: 4px;">
            <strong>${refNo}</strong>
          </span>.
        </p>` : ''}
        
        <p style="margin-top: 20px;">
          Your profile is currently under the verification process. Once the verification is complete, we will notify you via email.
        </p>
        
        <p>We are excited to have you as a member!</p>

        <p style="margin-top: 30px;">
          Best regards,<br/>
          <strong>Team ${school?.name || 'School Management'}</strong>
        </p>
      </div>
    `,
    };
};

const getAnnouncementTemplate = (data) => {
    const { announcement, school, recipient } = data;

    return {
        subject: announcement?.title || 'Important Announcement',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #1976D2;">${announcement?.title || 'Announcement'}</h2>
        
        <p>Dear <strong>${recipient?.name || 'Student/Parent'}</strong>,</p>
        
        <div style="background-color: #E3F2FD; padding: 15px; border-left: 4px solid #1976D2; margin: 20px 0;">
          ${announcement?.message || announcement?.content || ''}
        </div>
        
        ${announcement?.date ? `<p><strong>Date:</strong> ${announcement.date}</p>` : ''}
        
        <p style="margin-top: 30px;">
          Best regards,<br/>
          <strong>${school?.name || 'School Administration'}</strong>
        </p>
      </div>
    `,
    };
};

const getStudentAbsentTemplate = (data) => {
    const { student, absence, school, parent } = data;
    const parentName = parent?.father?.name || parent?.mother?.name || 'Parent';

    return {
        subject: `Absence Notification - ${student?.fullName || student?.firstName || 'Student'}`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #D32F2F;">Student Absence Notification</h2>
        
        <p>Dear <strong>${parentName}</strong>,</p>
        
        <p>This is to inform you that your child <strong>${student?.fullName || student?.firstName || ''}</strong> 
        (Class: ${student?.class || 'N/A'}, Section: ${student?.section || 'N/A'}) was absent on:</p>
        
        <div style="background-color: #FFEBEE; padding: 15px; border-left: 4px solid #D32F2F; margin: 20px 0;">
          <p><strong>Date:</strong> ${absence?.date || new Date().toLocaleDateString()}</p>
          ${absence?.period ? `<p><strong>Period/Session:</strong> ${absence.period}</p>` : ''}
        </div>
        
        <p>If this absence was planned or unavoidable, please inform us at your earliest convenience.</p>
        
        <p style="margin-top: 30px;">
          Regards,<br/>
          <strong>${school?.name || 'School Administration'}</strong>
        </p>
      </div>
    `,
    };
};

const getLeaveApprovalTemplate = (data) => {
    const { leave, student, teacher, school } = data;
    const applicantName = student?.fullName || teacher?.fullName || 'Applicant';

    return {
        subject: 'Leave Request Approved',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #2E7D32;">Leave Request Approved ✓</h2>
        
        <p>Dear <strong>${applicantName}</strong>,</p>
        
        <p>Your leave request has been <strong style="color: #2E7D32;">APPROVED</strong>.</p>
        
        <div style="background-color: #E8F5E9; padding: 15px; border-left: 4px solid #2E7D32; margin: 20px 0;">
          <p><strong>Leave Period:</strong> ${leave?.startDate || 'N/A'} to ${leave?.endDate || 'N/A'}</p>
          <p><strong>Reason:</strong> ${leave?.reason || 'N/A'}</p>
        </div>
        
        <p>Please ensure all necessary arrangements are made during your absence.</p>
        
        <p style="margin-top: 30px;">
          Best wishes,<br/>
          <strong>${school?.name || 'School Administration'}</strong>
        </p>
      </div>
    `,
    };
};

const getLeaveRejectionTemplate = (data) => {
    const { leave, student, teacher, school } = data;
    const applicantName = student?.fullName || teacher?.fullName || 'Applicant';

    return {
        subject: 'Leave Request Declined',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #C62828;">Leave Request Declined</h2>
        
        <p>Dear <strong>${applicantName}</strong>,</p>
        
        <p>We regret to inform you that your leave request has been <strong style="color: #C62828;">DECLINED</strong>.</p>
        
        <div style="background-color: #FFEBEE; padding: 15px; border-left: 4px solid #C62828; margin: 20px 0;">
          <p><strong>Requested Period:</strong> ${leave?.startDate || 'N/A'} to ${leave?.endDate || 'N/A'}</p>
          ${leave?.rejectionReason ? `<p><strong>Reason for Decline:</strong> ${leave.rejectionReason}</p>` : ''}
        </div>
        
        <p>Please contact the administration office for further clarification if needed.</p>
        
        <p style="margin-top: 30px;">
          Regards,<br/>
          <strong>${school?.name || 'School Administration'}</strong>
        </p>
      </div>
    `,
    };
};

const getParentTeacherMeetingTemplate = (data) => {
    const { meeting, school, parent, student } = data;
    const parentName = parent?.father?.name || parent?.mother?.name || 'Parent';

    return {
        subject: 'Parent-Teacher Meeting Invitation',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #7B1FA2;">Parent-Teacher Meeting Invitation</h2>
        
        <p>Dear <strong>${parentName}</strong>,</p>
        
        <p>You are cordially invited to attend the Parent-Teacher Meeting for your child 
        <strong>${student?.fullName || student?.firstName || ''}</strong>.</p>
        
        <div style="background-color: #F3E5F5; padding: 15px; border-left: 4px solid #7B1FA2; margin: 20px 0;">
          <p><strong>Date:</strong> ${meeting?.date || 'TBA'}</p>
          <p><strong>Time:</strong> ${meeting?.time || 'TBA'}</p>
          <p><strong>Venue:</strong> ${meeting?.venue || 'School Campus'}</p>
        </div>
        
        <p>Your presence is important to discuss your child's academic progress and development.</p>
        
        <p style="margin-top: 30px;">
          Looking forward to meeting you,<br/>
          <strong>${school?.name || 'School Administration'}</strong>
        </p>
      </div>
    `,
    };
};

const getFeeReminderTemplate = (data) => {
    const { fee, student, school, parent } = data;
    const parentName = parent?.father?.name || parent?.mother?.name || 'Parent';

    return {
        subject: 'Fee Payment Reminder',
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #F57C00;">Fee Payment Reminder</h2>
        
        <p>Dear <strong>${parentName}</strong>,</p>
        
        <p>This is a friendly reminder regarding the pending fee payment for 
        <strong>${student?.fullName || student?.firstName || 'your child'}</strong>.</p>
        
        <div style="background-color: #FFF3E0; padding: 15px; border-left: 4px solid #F57C00; margin: 20px 0;">
          <p><strong>Fee Type:</strong> ${fee?.type || 'School Fee'}</p>
          <p><strong>Amount:</strong> ₹${fee?.amount || '0'}</p>
          <p><strong>Due Date:</strong> ${fee?.dueDate || 'ASAP'}</p>
        </div>
        
        <p>Please make the payment at your earliest convenience to avoid any late fees.</p>
        
        <p style="margin-top: 30px;">
          Thank you,<br/>
          <strong>${school?.name || 'School Administration'}</strong>
        </p>
      </div>
    `,
    };
};

const getExamResultsTemplate = (data) => {
    const { exam, student, school } = data;

    return {
        subject: `Exam Results - ${exam?.name || 'Examination'}`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2 style="color: #0288D1;">Exam Results Published</h2>
        
        <p>Dear <strong>${student?.fullName || student?.firstName || 'Student'}</strong>,</p>
        
        <p>The results for <strong>${exam?.name || 'the examination'}</strong> have been published.</p>
        
        <div style="background-color: #E1F5FE; padding: 15px; border-left: 4px solid #0288D1; margin: 20px 0;">
          ${exam?.totalMarks ? `<p><strong>Total Marks:</strong> ${exam.totalMarks}</p>` : ''}
          ${exam?.obtainedMarks ? `<p><strong>Obtained Marks:</strong> ${exam.obtainedMarks}</p>` : ''}
          ${exam?.percentage ? `<p><strong>Percentage:</strong> ${exam.percentage}%</p>` : ''}
        </div>
        
        <p>Please check your student portal for detailed subject-wise results.</p>
        
        <p style="margin-top: 30px;">
          Best wishes,<br/>
          <strong>${school?.name || 'School Administration'}</strong>
        </p>
      </div>
    `,
    };
};

module.exports = {
    welcome: getWelcomeTemplate,
    announcement: getAnnouncementTemplate,
    student_absent: getStudentAbsentTemplate,
    parent_teacher_meeting: getParentTeacherMeetingTemplate,
    leave_approval: getLeaveApprovalTemplate,
    leave_rejection: getLeaveRejectionTemplate,
    exam_results: getExamResultsTemplate,
    fee_reminder: getFeeReminderTemplate,
};
