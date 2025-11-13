import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { GetCategoriesQueryDto } from './dto/get-categories-query.dto';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // LIST + PAGINATION + SEARCH
  async findAll(query: GetCategoriesQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const [data, total] = await this.categoryRepo.findAndCount({
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
    const category = await this.categoryRepo.findOne({
      where: { id: parseInt(id, 10) },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  // CREATE
  async create(dto: CreateCategoryDto) {
    // Check if name already exists
    const existingCategory = await this.categoryRepo.findOne({
      where: { name: dto.name },
    });
    if (existingCategory) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const category = new Category();
    category.name = dto.name;

    return this.categoryRepo.save(category);
  }

  // UPDATE
  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepo.findOne({
      where: { id: parseInt(id, 10) },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    if (dto.name !== undefined) {
      // Check if new name is already taken by another category
      const existingCategory = await this.categoryRepo.findOne({
        where: { name: dto.name },
      });
      if (existingCategory && existingCategory.id !== parseInt(id, 10)) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      category.name = dto.name;
    }

    return this.categoryRepo.save(category);
  }

  // DELETE
  async remove(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['books'],
    });

    if (!category) throw new NotFoundException('Categoría no encontrada');

    // Check if category has associated books
    if (category.books && category.books.length > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene libros asociados',
      );
    }

    const result = await this.categoryRepo.delete(parseInt(id, 10));
    if (!result.affected)
      throw new NotFoundException('Categoría no encontrada');
    return;
  }
}
