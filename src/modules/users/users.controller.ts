import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { TypedEventEmitter } from '../../event-emitter/typed-event-emitter.class';
/* typed-event-emitter.class'; */

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: TypedEventEmitter
  ) {}

  @Post('/')
  async create(@Body() createUserDto: CreateUserDto) {
    this.eventEmitter.emit('user.welcome', {
      name: createUserDto.name,
      email: createUserDto.email,
    });

    this.eventEmitter.emit('user.verify-email', {
      name: createUserDto.name,
      email: createUserDto.email,
    });
    return await this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get('/:id')
  async findById(@Param() params: any): Promise<User> {
    return await this.usersService.findById(params.id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: number, @Body() userData: UpdateUserDto) {
    return this.usersService.update(id, userData);
  }
}
