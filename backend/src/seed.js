import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Event from './models/Event.js';
import EventAuditLog from './models/EventAuditLog.js';
import Notification from './models/Notification.js';
import Team from './models/Team.js';
import TeamInvitation from './models/TeamInvitation.js';
import JoinRequest from './models/JoinRequest.js';
import Bookmark from './models/Bookmark.js';
import Registration from './models/Registration.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eventra';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(' Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await EventAuditLog.deleteMany({});
    await Notification.deleteMany({});
    await Team.deleteMany({});
    await TeamInvitation.deleteMany({});
    await JoinRequest.deleteMany({});
    await Bookmark.deleteMany({});
    await Registration.deleteMany({});
    console.log(' Cleared old data');

    // Create users
    const admin = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'admin@eventra.edu',
      password: 'password123',
      role: 'admin',
      department: 'Dean of Student Affairs',
      year: 'Faculty',
      phone: '+1 555-0199',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    });

    const organizer = await User.create({
      name: 'Devin Vance (Lead Organizer)',
      email: 'organizer@eventra.edu',
      password: 'password123',
      role: 'organizer',
      department: 'Computer Science & Engineering',
      year: 'Final Year',
      phone: '+1 555-0144',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const student = await User.create({
      name: 'Elena Rostova',
      email: 'student@eventra.edu',
      password: 'password123',
      role: 'student',
      department: 'Artificial Intelligence & Data Science',
      year: '3rd Year',
      phone: '+1 555-0188',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    });

    console.log(' Created Demo Users: Admin, Organizer, Student');

    // 1. Published Event
    const publishedEvent = await Event.create({
      title: 'HackNova 2026: 36-Hour National Campus Hackathon',
      shortDescription: 'The biggest flagship hackathon uniting 500+ builders to create next-gen AI and decentralized apps.',
      detailedDescription: 'HackNova brings together the most ambitious engineers, designers, and innovators. Join us for 36 hours of non-stop hacking, mentoring from Silicon Valley founders, high-stakes pitch sessions, and $15,000 in prizes across tracks including Generative AI, Web3, Climate Tech, and Health Innovation.',
      category: 'Hackathon',
      posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&auto=format&fit=crop&q=80',
      venue: 'Main Auditorium & Innovation Lab Complex',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // in 7 days
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      registrationStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxCapacity: 350,
      currentRegistrations: 184,
      eventType: 'Team',
      minTeamSize: 2,
      maxTeamSize: 4,
      eligibilityCriteria: 'Undergraduate and postgraduate students with valid college ID.',
      departmentRestrictions: ['All Departments'],
      academicYearRestrictions: ['All Years'],
      isPaid: false,
      registrationFee: 0,
      rules: '1. All code must be written during the event.\n2. Teams can consist of 2 to 4 members.\n3. Respect code of conduct and campus protocols.',
      contactInfo: {
        name: 'Devin Vance',
        email: 'hacknova@eventra.edu',
        phone: '+1 555-0144',
      },
      status: 'published',
      organizer: organizer._id,
      submissionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // 2. Pending Approval Event
    const pendingEvent = await Event.create({
      title: 'Cloud Architect Bootcamp & AWS Hands-on Workshop',
      shortDescription: 'Deep dive into microservices, serverless architectures, and Kubernetes with certified AWS solutions architects.',
      detailedDescription: 'Hands-on experiential training where students will deploy full-stack production clusters on cloud infrastructure. Covers container orchestration, load balancing, CI/CD pipelines, and cost optimization.',
      category: 'Workshop',
      posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80',
      venue: 'Computing Center - Hall 3',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      registrationStartDate: new Date(),
      registrationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      maxCapacity: 120,
      currentRegistrations: 0,
      eventType: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 1,
      eligibilityCriteria: 'Open to 2nd, 3rd, and 4th year CS, IT, and ECE students.',
      departmentRestrictions: ['Computer Science', 'Information Technology', 'Electronics & Comm.'],
      academicYearRestrictions: ['2nd Year', '3rd Year', 'Final Year'],
      isPaid: true,
      registrationFee: 15,
      rules: '1. Laptops with Docker installed are required.\n2. AWS free tier accounts must be configured beforehand.',
      contactInfo: {
        name: 'Devin Vance',
        email: 'cloud@eventra.edu',
        phone: '+1 555-0144',
      },
      status: 'pending_approval',
      organizer: organizer._id,
      submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // 3. Changes Requested Event
    const changesRequestedEvent = await Event.create({
      title: 'RoboWars 2026: Combat Robotics Championship',
      shortDescription: 'High-octane metal combat championship featuring 15kg and 30kg wired & wireless bot duels in an armored polycarbonate arena.',
      detailedDescription: 'Watch autonomous and tele-operated combat bots clash in an enclosed steel-reinforced arena. Trophies for Best Armor, Most Lethal Weapon, and Grand Champion.',
      category: 'Technical',
      posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80',
      venue: 'Open Air Amphitheatre',
      eventDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      startTime: '02:00 PM',
      endTime: '08:00 PM',
      registrationStartDate: new Date(),
      registrationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      maxCapacity: 50,
      currentRegistrations: 0,
      eventType: 'Team',
      minTeamSize: 2,
      maxTeamSize: 5,
      eligibilityCriteria: 'All university engineering clubs.',
      departmentRestrictions: ['All Departments'],
      academicYearRestrictions: ['All Years'],
      isPaid: false,
      registrationFee: 0,
      rules: '1. Battery safety standards must comply with LiPo fire safety protocols.\n2. Flamethrowers and liquids prohibited.',
      contactInfo: {
        name: 'Devin Vance',
        email: 'robowars@eventra.edu',
        phone: '+1 555-0144',
      },
      status: 'changes_requested',
      adminFeedback: 'Please provide proof of safety clearances and add emergency fire extinguishers in the arena setup specifications before approval.',
      organizer: organizer._id,
      submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // 4. Approved Event (Ready to be published by organizer)
    const approvedEvent = await Event.create({
      title: 'TEDx Campus: Ideas Worth Spreading 2026',
      shortDescription: 'An inspiring evening of thought-provoking talks by renowned scientists, innovators, and changemakers.',
      detailedDescription: 'Under the official TEDx license, 8 stellar speakers explore the theme "Horizons Beyond". Includes networking dinner and curated cultural performances.',
      category: 'Cultural',
      posterUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=900&auto=format&fit=crop&q=80',
      venue: 'Auditorium Hall A',
      eventDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      startTime: '05:00 PM',
      endTime: '09:00 PM',
      registrationStartDate: new Date(),
      registrationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
      maxCapacity: 400,
      currentRegistrations: 0,
      eventType: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 1,
      eligibilityCriteria: 'Open to all enrolled students and faculty.',
      departmentRestrictions: ['All Departments'],
      academicYearRestrictions: ['All Years'],
      isPaid: true,
      registrationFee: 10,
      rules: 'Formal or business casual attire required. Doors close at 04:50 PM sharp.',
      contactInfo: {
        name: 'Devin Vance',
        email: 'tedx@eventra.edu',
        phone: '+1 555-0144',
      },
      status: 'approved',
      adminFeedback: 'Approved by Dean Office. Looks fantastic! Ready for ticket release.',
      organizer: organizer._id,
      submissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // 5. Draft Event
    const draftEvent = await Event.create({
      title: 'Inter-Collegiate Esports Showdown (Valorant & FIFA)',
      shortDescription: 'Campus gaming tournament spanning 3 gaming arenas with high-refresh monitors and shoutcasting.',
      detailedDescription: 'Double-elimination tournament for 32 teams. Live streaming on Twitch with student casters.',
      category: 'Sports',
      posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&auto=format&fit=crop&q=80',
      venue: 'Student Activity Center - Gaming Lounge',
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      startTime: '11:00 AM',
      endTime: '07:00 PM',
      registrationStartDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      maxCapacity: 160,
      eventType: 'Team',
      minTeamSize: 5,
      maxTeamSize: 6,
      eligibilityCriteria: 'All campus gamers.',
      departmentRestrictions: ['All Departments'],
      academicYearRestrictions: ['All Years'],
      isPaid: false,
      registrationFee: 0,
      rules: 'Zero tolerance for toxicity. Bring own peripherals if preferred.',
      contactInfo: {
        name: 'Devin Vance',
        email: 'esports@eventra.edu',
        phone: '+1 555-0144',
      },
      status: 'draft',
      organizer: organizer._id,
    });

    // 6. Cancelled Event
    const cancelledEvent = await Event.create({
      title: 'Annual Stargazing & Astronomy Campout',
      shortDescription: 'Night telescope observation of the Perseid meteor shower from the campus observatory hill.',
      detailedDescription: 'Guided astronomy session with optical telescopes. Cancelled due to anticipated monsoon weather.',
      category: 'Academic',
      posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=900&auto=format&fit=crop&q=80',
      venue: 'Observatory Hill',
      eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      startTime: '08:00 PM',
      endTime: '02:00 AM',
      registrationStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      maxCapacity: 80,
      eventType: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 1,
      status: 'cancelled',
      cancellationReason: 'Adverse weather forecast and persistent overcast skies.',
      organizer: organizer._id,
      cancelledAt: new Date(),
      contactInfo: {
        name: 'Devin Vance',
        email: 'astronomy@eventra.edu',
        phone: '+1 555-0144',
      },
    });

    console.log(' Created 6 events across all workflow lifecycle states');

    // Create Audit Logs
    await EventAuditLog.create([
      {
        event: publishedEvent._id,
        action: 'created_as_draft',
        previousStatus: '',
        newStatus: 'draft',
        performedBy: organizer._id,
        comments: 'Draft created with initial hackathon parameters',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        event: publishedEvent._id,
        action: 'submitted_for_approval',
        previousStatus: 'draft',
        newStatus: 'pending_approval',
        performedBy: organizer._id,
        comments: 'Submitted for Dean Office review',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        event: publishedEvent._id,
        action: 'event_approved',
        previousStatus: 'pending_approval',
        newStatus: 'approved',
        performedBy: admin._id,
        comments: 'All budget and venue bookings validated. Approved!',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        event: publishedEvent._id,
        action: 'event_published',
        previousStatus: 'approved',
        newStatus: 'published',
        performedBy: organizer._id,
        comments: 'Event launched live to campus community',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        event: changesRequestedEvent._id,
        action: 'submitted_for_approval',
        previousStatus: 'draft',
        newStatus: 'pending_approval',
        performedBy: organizer._id,
        comments: 'Initial submission of RoboWars',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        event: changesRequestedEvent._id,
        action: 'changes_requested',
        previousStatus: 'pending_approval',
        newStatus: 'changes_requested',
        performedBy: admin._id,
        comments: 'Please provide proof of safety clearances and add emergency fire extinguishers in the arena setup specifications before approval.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        event: approvedEvent._id,
        action: 'event_approved',
        previousStatus: 'pending_approval',
        newStatus: 'approved',
        performedBy: admin._id,
        comments: 'Approved by Dean Office. Looks fantastic! Ready for ticket release.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        event: pendingEvent._id,
        action: 'submitted_for_approval',
        previousStatus: 'draft',
        newStatus: 'pending_approval',
        performedBy: organizer._id,
        comments: 'Submitted AWS bootcamp for lab allocation approval',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ]);

    // Create Initial Notifications
    await Notification.create([
      {
        recipient: admin._id,
        sender: organizer._id,
        title: 'New Event Pending Approval',
        message: 'Event "Cloud Architect Bootcamp & AWS Hands-on Workshop" is waiting for your review.',
        type: 'event_submitted',
        event: pendingEvent._id,
        isRead: false,
      },
      {
        recipient: organizer._id,
        sender: admin._id,
        title: 'Modifications Requested for Event',
        message: 'Administrator requested safety clearance details for "RoboWars 2026".',
        type: 'changes_requested',
        event: changesRequestedEvent._id,
        isRead: false,
      },
      {
        recipient: organizer._id,
        sender: admin._id,
        title: 'Event Approved!',
        message: 'Your event "TEDx Campus: Ideas Worth Spreading 2026" has been approved and is ready to publish.',
        type: 'event_approved',
        event: approvedEvent._id,
        isRead: false,
      },
    ]);

    // Create Bookmarks
    await Bookmark.create([
      { user: student._id, event: publishedEvent._id },
    ]);

    // Create Team: Neural Hackers for HackNova
    const team1 = await Team.create({
      name: 'Neural Hackers',
      description: 'Building an edge AI assistive drone platform for emergency campus rescue.',
      event: publishedEvent._id,
      leader: student._id,
      members: [
        { user: student._id, role: 'Team Leader & ML Engineer', joinedAt: new Date() },
      ],
      requiredSkills: ['Python', 'PyTorch', 'React', 'Robotics'],
      openRoles: ['Frontend Developer', 'Hardware Specialist', 'UI Designer'],
      isPublicRecruiting: true,
      status: 'forming',
    });

    // Create Team 2: Cloud Sync
    const team2 = await Team.create({
      name: 'CloudSync Squad',
      description: 'Developing decentralized collaborative document workspaces on IPFS & WebRTC.',
      event: publishedEvent._id,
      leader: organizer._id,
      members: [
        { user: organizer._id, role: 'Team Leader', joinedAt: new Date() },
      ],
      requiredSkills: ['Go', 'Docker', 'WebSockets', 'Tailwind'],
      openRoles: ['Fullstack Engineer', 'DevOps Specialist'],
      isPublicRecruiting: true,
      status: 'forming',
    });

    // Create Join Request for team1
    await JoinRequest.create({
      team: team1._id,
      event: publishedEvent._id,
      applicant: organizer._id,
      message: 'Hey! I would love to join your team as a frontend engineer. I have 2 years of React experience.',
      desiredRole: 'Frontend Developer',
      status: 'pending',
    });

    // Create Invitation from team2 to student
    await TeamInvitation.create({
      team: team2._id,
      event: publishedEvent._id,
      sender: organizer._id,
      recipient: student._id,
      invitedRole: 'Core Developer',
      message: 'We noticed your strong AI background and would love you to lead our machine learning module!',
      status: 'pending',
    });

    console.log(' Seeded Teams, Bookmarks, Invitations, and Join Requests successfully');
    console.log(' Database seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
