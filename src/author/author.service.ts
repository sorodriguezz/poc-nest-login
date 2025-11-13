import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { GetAuthorsQueryDto } from './dto/get-authors-query.dto';
import { Author } from '../entities/author.entity';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepo: Repository<Author>,
  ) {}

  // LIST + PAGINATION + SEARCH
  async findAll(query: GetAuthorsQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const [data, total] = await this.authorRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { name: 'ASC' },
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
    const author = await this.authorRepo.findOne({
      where: { id: parseInt(id, 10) },
    });
    if (!author) throw new NotFoundException('Autor no encontrado');
    return author;
  }

  // CREATE
  async create(dto: CreateAuthorDto) {
    // Check if name already exists
    const existingAuthor = await this.authorRepo.findOne({
      where: { name: dto.name },
    });
    if (existingAuthor) {
      throw new ConflictException('Ya existe un autor con ese nombre');
    }

    const author = new Author();
    author.name = dto.name;
    author.bio = dto.bio;

    return this.authorRepo.save(author);
  }

  // UPDATE
  async update(id: string, dto: UpdateAuthorDto) {
    const author = await this.authorRepo.findOne({
      where: { id: parseInt(id, 10) },
    });
    if (!author) throw new NotFoundException('Autor no encontrado');

    if (dto.name !== undefined) {
      // Check if new name is already taken by another author
      const existingAuthor = await this.authorRepo.findOne({
        where: { name: dto.name },
      });
      if (existingAuthor && existingAuthor.id !== parseInt(id, 10)) {
        throw new ConflictException('Ya existe un autor con ese nombre');
      }
      author.name = dto.name;
    }

    if (dto.bio !== undefined) {
      author.bio = dto.bio;
    }

    return this.authorRepo.save(author);
  }

  // DELETE
  async remove(id: string) {
    const author = await this.authorRepo.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['books'],
    });

    if (!author) throw new NotFoundException('Autor no encontrado');

    // Check if author has associated books
    if (author.books && author.books.length > 0) {
      throw new ConflictException(
        'No se puede eliminar el autor porque tiene libros asociados',
      );
    }

    const result = await this.authorRepo.delete(parseInt(id, 10));
    if (!result.affected) throw new NotFoundException('Autor no encontrado');
    return;
  }
}
