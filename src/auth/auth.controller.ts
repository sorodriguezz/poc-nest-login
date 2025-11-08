import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);

    const { accessToken, refreshToken } = this.authService.signTokens(user);

    await this.authService.setRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, role: user.role, email: user.email };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(200)
  async refresh(@Headers('x-refresh-token') refreshHeader?: string) {
    if (!refreshHeader) {
      throw new UnauthorizedException('Falta x-refresh-token');
    }

    const decoded: any = jwt.decode(refreshHeader);

    const userId = decoded?.sub as string | undefined;

    if (!userId) throw new UnauthorizedException();

    const ok = await this.authService.validateRefreshToken(
      userId,
      refreshHeader,
    );

    if (!ok) throw new UnauthorizedException();

    const user = await this.usersRepo.findOneBy({ id: userId });

    if (!user) throw new UnauthorizedException();

    const { accessToken } = this.authService.signTokens(user);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Headers('x-refresh-token') refreshHeader?: string) {
    if (refreshHeader) {
      const decoded: any = jwt.decode(refreshHeader);
      const userId = decoded?.sub as string | undefined;

      if (userId) await this.authService.revokeRefreshToken(userId);
    }

    return;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: { sub: string }) {
    const userFounded = await this.usersRepo.findOne({
      where: { id: user.sub },
    });

    if (!userFounded) {
      throw new BadRequestException('User not found');
    }

    return userFounded;
  }

  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto) {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });

    if (exists) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      email: dto.email,
      password: passwordHash,
      role: 'USER',
    });
    await this.usersRepo.save(user);

    const { accessToken, refreshToken } = this.authService.signTokens(user);
    await this.authService.setRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, role: user.role, email: user.email };
  }
}
