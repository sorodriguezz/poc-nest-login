import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtAccessStrategy } from './auth/strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './auth/strategies/jwt-refresh.strategy';
import { Author } from './entities/author.entity';
import { Book } from './entities/book.entity';
import { Category } from './entities/category.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'postgres',
      synchronize: true,
      autoLoadEntities: true,
      entities: [User, Author, Book, Category],
    }),
    AuthModule,
  ],
  providers: [JwtAccessStrategy, JwtRefreshStrategy],
})
export class AppModule {}
