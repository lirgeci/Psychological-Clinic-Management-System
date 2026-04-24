const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const userRoutes = require('./routes/userRoutes');
const { Role, User, UserRole, Therapist } = require('./models');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', userRoutes);

app.get('/api/health', (_req, res) => {
	res.status(200).json({
		ok: true,
		message: 'Backend is running',
		timestamp: new Date().toISOString(),
	});
});

app.use((_req, res) => {
	res.status(404).json({ ok: false, message: 'Route not found' });
});

const seedRoles = async () => {
	const requiredRoles = [
		{ Id: 1, Name: 'Admin' },
		{ Id: 2, Name: 'Therapist' },
		{ Id: 3, Name: 'Patient' },
	];

	for (const role of requiredRoles) {
		const existingRole = await Role.findByPk(role.Id);
		if (!existingRole) {
			await Role.create(role);
		}
	}
};

const seedAdminUser = async () => {
	const adminEmail = 'admin@phms.com';
	const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';

	let adminUser = await User.findOne({ where: { Email: adminEmail } });

	if (!adminUser) {
		const passwordHash = await bcrypt.hash(adminPassword, 12);
		adminUser = await User.create({
			Email: adminEmail,
			PasswordHash: passwordHash,
		});
	}

	const adminRoleLink = await UserRole.findOne({
		where: {
			UserId: adminUser.Id,
			RoleId: 1,
		},
	});

	if (!adminRoleLink) {
		await UserRole.create({
			UserId: adminUser.Id,
			RoleId: 1,
		});
	}
};

const seedTherapistUser = async () => {
	const therapistEmail = 'therapist@phms.com';
	const therapistPassword = process.env.THERAPIST_SEED_PASSWORD || 'Therapist123!';

	// Keep the seed idempotent so startup can run repeatedly without duplicates.
	const therapistUser = await User.findOne({ where: { Email: therapistEmail } });

	if (!therapistUser) {
		const passwordHash = await bcrypt.hash(therapistPassword, 12);
		const createdUser = await User.create({
			Email: therapistEmail,
			PasswordHash: passwordHash,
		});

		await Therapist.create({
			FirstName: 'Default',
			LastName: 'Therapist',
			Email: therapistEmail,
			Phone: '000000000',
			Specialization: 'General',
			LicenseNumber: 'LIC-001',
			Qualifications: 'Licensed therapist with general clinical training.',
			Biography: 'Default seeded therapist account for system setup and testing.',
			EmploymentDate: new Date(),
			UserId: createdUser.Id,
		});

		await UserRole.create({
			UserId: createdUser.Id,
			RoleId: 2,
		});
	}
};

const startServer = async () => {
	try {
		// Seed fixed roles once on startup without duplicating existing rows.
		await seedRoles();
		await seedAdminUser();
		await seedTherapistUser();

		app.listen(PORT, () => {
			const baseUrl = `http://localhost:${PORT}`;
			console.log(`Server running on ${baseUrl}`);
			console.log(`Health check: ${baseUrl}/api/health`);
		});
	} catch (error) {
		console.error('Startup failed:', error.message);
		process.exit(1);
	}
};

startServer();
