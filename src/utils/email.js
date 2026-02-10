// Email utility - implement with SendGrid, AWS SES, or your preferred service
exports.sendEmail = async (to, subject, html) => {
  console.log(`Sending email to ${to}: ${subject}`);
  // Implement email sending here
  return true;
};

exports.sendDepositApprovalEmail = async (user, deposit) => {
  const subject = 'Deposit Approved - MONETA-ICT';
  const html = `
    <h2>Your deposit has been approved!</h2>
    <p>Amount: ${deposit.amount} ${deposit.currency}</p>
    <p>Your new balance is available for investment.</p>
  `;
  return exports.sendEmail(user.email, subject, html);
};
