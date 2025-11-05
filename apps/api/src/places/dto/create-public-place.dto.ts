import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsUrl,
  Length,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreatePublicPlaceDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 200)
  @Matches(/^[가-힣a-zA-Z0-9\s\-,.]+$/, {
    message: '주소 형식이 올바르지 않습니다',
  })
  address!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9\-+() ]+$/, {
    message: '전화번호 형식이 올바르지 않습니다',
  })
  phone?: string;

  @IsNumber()
  @Min(33) // 한국 최남단
  @Max(38.6) // 한국 최북단
  latitude!: number;

  @IsNumber()
  @Min(124.5) // 한국 최서단
  @Max(132) // 한국 최동단
  longitude!: number;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  category!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @IsOptional()
  @IsString()
  externalId?: string;
}
