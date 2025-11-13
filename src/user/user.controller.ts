import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: User) {
    // Only admins can create users
    if (user.role !== 'ADMIN') {
      throw new Error('No tienes permisos para crear usuarios');
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query: GetUsersQueryDto, @CurrentUser() user: User) {
    // Only admins can list all users
    if (user.role !== 'ADMIN') {
      throw new Error('No tienes permisos para ver usuarios');
    }
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    // Users can see their own profile, admins can see any profile
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new Error('No tienes permisos para ver este usuario');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    // Users can update their own profile, admins can update any profile
    if (user.role !== 'ADMIN' && user.id !== id) {
      throw new Error('No tienes permisos para actualizar este usuario');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    // Only admins can delete users
    if (user.role !== 'ADMIN') {
      throw new Error('No tienes permisos para eliminar usuarios');
    }
    // Prevent self-deletion
    if (user.id === id) {
      throw new Error('No puedes eliminar tu propio usuario');
    }
    return this.usersService.remove(id);
  }
}
