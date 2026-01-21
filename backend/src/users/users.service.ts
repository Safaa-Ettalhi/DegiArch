import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll() {
    return this.userModel.find().select('-passwordHash').exec();
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = registerDto;
    const user = new this.userModel({
      ...userData,
      passwordHash,
    });

    await user.save();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user.toObject();
    return result;
  }

  async update(id: string, updateData: Partial<RegisterDto>) {
    const updatePayload: Partial<UserDocument> & { password?: string } = {
      ...updateData,
    };

    if (updateData.password) {
      updatePayload.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updatePayload.password;
    }
    const user = await this.userModel
      .findByIdAndUpdate(id, updatePayload, { new: true })
      .select('-passwordHash');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deactivated successfully' };
  }
}
