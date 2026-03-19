import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { TenantsService } from "@/modules/tenants/tenants.service";
import { RegistrationService } from "@/modules/auth/registration.service";
import { UsersModule } from "../users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { jwtConstants } from "./constants";
import { TenancyModule } from "@/modules/tenancy/tenancy.module";
import { TenantsModule } from "@/modules/tenants/tenants.module";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      //signOptions: { expiresIn: '60s' },
    }),
    TenancyModule,
    TenantsModule,
  ],
  providers: [AuthService, RegistrationService],
  controllers: [AuthController],
  exports: [AuthService, RegistrationService, TenancyModule],
})
export class AuthModule {}
