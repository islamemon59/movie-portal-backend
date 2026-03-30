import { prisma } from './src/config/database';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@movieportal.com',
        name: 'Admin User',
        emailVerified: true,
        role: 'ADMIN',
        image: 'https://via.placeholder.com/150?text=Admin',
      },
    });

    console.log('✅ Admin user created successfully:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);

    // Create sample genres
    const genres = await Promise.all([
      prisma.genre.upsert({
        where: { slug: 'action' },
        update: {},
        create: { name: 'Action', slug: 'action' },
      }),
      prisma.genre.upsert({
        where: { slug: 'drama' },
        update: {},
        create: { name: 'Drama', slug: 'drama' },
      }),
      prisma.genre.upsert({
        where: { slug: 'comedy' },
        update: {},
        create: { name: 'Comedy', slug: 'comedy' },
      }),
      prisma.genre.upsert({
        where: { slug: 'horror' },
        update: {},
        create: { name: 'Horror', slug: 'horror' },
      }),
      prisma.genre.upsert({
        where: { slug: 'sci-fi' },
        update: {},
        create: { name: 'Sci-Fi', slug: 'sci-fi' },
      }),
    ]);

    console.log('✅ Genres created:', genres.map((g) => g.name).join(', '));

    // Create sample platforms
    const platforms = await Promise.all([
      prisma.platform.upsert({
        where: { slug: 'netflix' },
        update: {},
        create: { name: 'Netflix', slug: 'netflix' },
      }),
      prisma.platform.upsert({
        where: { slug: 'amazon-prime' },
        update: {},
        create: { name: 'Amazon Prime', slug: 'amazon-prime' },
      }),
      prisma.platform.upsert({
        where: { slug: 'disney-plus' },
        update: {},
        create: { name: 'Disney+', slug: 'disney-plus' },
      }),
      prisma.platform.upsert({
        where: { slug: 'hulu' },
        update: {},
        create: { name: 'Hulu', slug: 'hulu' },
      }),
    ]);

    console.log('✅ Platforms created:', platforms.map((p) => p.name).join(', '));

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
