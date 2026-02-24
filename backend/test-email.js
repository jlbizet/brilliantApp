const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEmailNotification() {
  console.log('Testing Email Notification...');
  
  const patient = await prisma.patient.findFirst({ 
    where: { email: { not: null } },
    include: { appointments: false }
  });
  
  if (!patient) {
    console.log('No patient with email found');
    return;
  }
  
  const dentist = await prisma.user.findFirst({ where: { role: 'DENTIST' } });
  
  if (!dentist) {
    console.log('No dentist found');
    return;
  }
  
  console.log(`Patient: ${patient.firstName} ${patient.lastName} (${patient.email})`);
  console.log(`Dentist: Dr. ${dentist.firstName} ${dentist.lastName}`);
  
  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      dentistId: dentist.id,
      title: 'Test Email Notification',
      startTime: startTime,
      endTime: endTime,
      status: 'SCHEDULED',
    },
    include: { 
      patient: true, 
      dentist: true 
    }
  });
  
  console.log(`Appointment created: ${appointment.id}`);
  console.log('Check your email for the confirmation!');
}

testEmailNotification()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
