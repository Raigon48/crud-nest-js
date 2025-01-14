import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    async signup(dto: AuthDto) {
        const {email, password} = dto;

        //hash password
        const hash = await argon.hash(password);

        try {
            const user = await this.prisma.user.create({
                data: {
                    email,
                    hash
                }
            });
            return user;
        } catch(error) {
            if(error instanceof PrismaClientKnownRequestError) {
                if(error.code === 'P2002') {
                    throw new ForbiddenException('Credentials taken');
                }
            }
            throw error;
        }

    }

    async signin(dto: AuthDto) {
        const {email, password} = dto;

        const user = await this.prisma.user.findFirst({
            where: {
                email: email
            }
        });

        if(!user) {
            throw new ForbiddenException('Incorrect credentials');
        }

        const isValidPassword = await argon.verify(user.hash, password);

        if(!isValidPassword) {
            throw new ForbiddenException('Incorrect credentials');
        }

        return user;
    }
}
