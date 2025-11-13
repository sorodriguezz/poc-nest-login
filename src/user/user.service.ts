import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // LIST + PAGINATION + FILTERING
  async findAll(query: GetUsersQueryDto) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (search) {
      where.email = ILike(`%${search}%`);
    }

    if (role) {
      where.role = role;
    }

    const [data, total] = await this.userRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'role', 'createdAt'], // Exclude password and refreshTokenHash
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  // FIND ONE
  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'createdAt'], // Exclude password and refreshTokenHash
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // FIND BY EMAIL (for auth)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  // CREATE
  async create(dto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const user = new User();
    user.email = dto.email;
    user.password = await bcrypt.hash(dto.password, 10);
    user.role = dto.role || 'USER';

    return this.userRepo.save(user);
  }

  // UPDATE
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email !== undefined) {
      // Check if new email is already taken by another user
      const existingUser = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El email ya está registrado');
      }
      user.email = dto.email;
    }

    if (dto.password !== undefined) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    return this.userRepo.save(user);
  }

  // DELETE
  async remove(id: string) {
    const result = await this.userRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Usuario no encontrado');
    return;
  }

  // UPDATE REFRESH TOKEN
  async updateRefreshToken(id: string, refreshTokenHash: string | null) {
    await this.userRepo.update(id, {
      refreshTokenHash: refreshTokenHash || undefined,
    });
  }
}
