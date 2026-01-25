import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return null;
    }
    
    // Vérifier si le compte est désactivé
    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte est désactivé. Veuillez contacter le support.');
    }
    
    if (await bcrypt.compare(password, user.passwordHash)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto, isAdmin: boolean = false) {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const role = isAdmin ? registerDto.role : 'ARCHIVE_MANAGER';

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = registerDto;
    const user = new this.userModel({
      ...userData,
      role,
      passwordHash,
    });

    await user.save();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user.toObject();
    return result;
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
