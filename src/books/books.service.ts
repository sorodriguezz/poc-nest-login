import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { GetBooksQueryDto } from './dto/get-books-query.dto';
import { Book } from '../entities/book.entity';
import { Author } from '../entities/author.entity';
import { Category } from '../entities/category.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(Author) private readonly authorRepo: Repository<Author>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // LIST + PAGINATION
  async findAll(query: GetBooksQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (search) {
      // busca por título (case-insensitive)
      where.title = ILike(`%${search}%`);
    }

    const [data, total] = await this.bookRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'DESC' },
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
    const book = await this.bookRepo.findOne({
      where: { id: parseInt(id, 10) },
    });
    if (!book) throw new NotFoundException('Libro no encontrado');
    return book;
  }

  // CREATE
  async create(dto: CreateBookDto, user?: User) {
    const book = new Book();
    book.title = dto.title;
    book.isbn = dto.isbn;

    if (dto.authorId) {
      const author = await this.authorRepo.findOne({
        where: { id: parseInt(dto.authorId, 10) },
      });
      if (!author) throw new BadRequestException('Autor no existe');
      book.author = author;
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: parseInt(dto.categoryId, 10) },
      });
      if (!category) throw new BadRequestException('Categoría no existe');
      book.category = category;
    }

    if (user) {
      book.createdBy = user;
    }

    return this.bookRepo.save(book);
  }

  // UPDATE
  async update(id: string, dto: UpdateBookDto) {
    const book = await this.bookRepo.findOne({
      where: { id: parseInt(id, 10) },
    });
    if (!book) throw new NotFoundException('Libro no encontrado');

    if (dto.title !== undefined) book.title = dto.title;
    if (dto.isbn !== undefined) book.isbn = dto.isbn;
    // Note: La entidad Book no tiene propiedades 'summary' y 'year'

    if (dto.authorId !== undefined) {
      if (dto.authorId === (null as any)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        book.author = null as any;
      } else {
        const author = await this.authorRepo.findOne({
          where: { id: parseInt(dto.authorId, 10) },
        });
        if (!author) throw new BadRequestException('Autor no existe');
        book.author = author;
      }
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === (null as any)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        book.category = null as any;
      } else {
        const category = await this.categoryRepo.findOne({
          where: { id: parseInt(dto.categoryId, 10) },
        });
        if (!category) throw new BadRequestException('Categoría no existe');
        book.category = category;
      }
    }

    return this.bookRepo.save(book);
  }

  // DELETE
  async remove(id: string) {
    const result = await this.bookRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Libro no encontrado');
    return;
  }
}
