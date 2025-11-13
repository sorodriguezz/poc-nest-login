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
import { AuthorsService } from './author.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { GetAuthorsQueryDto } from './dto/get-authors-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('authors')
@UseGuards(JwtAuthGuard)
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  create(@Body() createAuthorDto: CreateAuthorDto, @CurrentUser() user: User) {
    // Only admins can create authors
    if (user.role !== 'ADMIN') {
      throw new Error('No tienes permisos para crear autores');
    }
    return this.authorsService.create(createAuthorDto);
  }

  @Get()
  findAll(@Query() query: GetAuthorsQueryDto) {
    return this.authorsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @CurrentUser() user: User,
  ) {
    // Only admins can update authors
    if (user.role !== 'ADMIN') {
      throw new Error('No tienes permisos para actualizar autores');
    }
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    // Only admins can delete authors
    if (user.role !== 'ADMIN') {
      throw new Error('No tienes permisos para eliminar autores');
    }
    return this.authorsService.remove(id);
  }
}
