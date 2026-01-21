import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../src/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@digiarch.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'DigiArch';

  const existingAdmin = await userModel.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(' Un administrateur avec cet email existe déjà:', adminEmail);
    await app.close();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = new userModel({
    email: adminEmail,
    passwordHash,
    firstName: adminFirstName,
    lastName: adminLastName,
    role: UserRole.ADMIN,
    isActive: true,
  });

  await admin.save();
  console.log(' Administrateur créé avec succès!');
  console.log(' Email:', adminEmail);
  console.log(' Mot de passe:', adminPassword);
  console.log(' Nom:', `${adminFirstName} ${adminLastName}`);
  
  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error(' Erreur lors de la création de l\'administrateur:', error);
  process.exit(1);
});
