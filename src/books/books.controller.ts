import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { GetBooksQueryDto } from './dto/get-books-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('books')
@UseGuards(JwtAuthGuard) // todas las rutas requieren estar logueado
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  async findAll(@Query() query: GetBooksQueryDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Post()
  async create(
    @Body() dto: CreateBookDto,
    @CurrentUser() user: { sub: string; email: string; role: 'ADMIN' | 'USER' },
  ) {
    // si quieres limitar a ADMIN:
    // if (user.role !== 'ADMIN') throw new ForbiddenException();
    return this.booksService.create(dto, { id: user.sub } as any);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.booksService.remove(id);
    return { deleted: true };
  }
}
