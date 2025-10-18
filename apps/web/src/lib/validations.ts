import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z
      .string()
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
      .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, '영문, 숫자, 특수문자만 사용 가능합니다'),
    passwordConfirm: z.string(),
    nickname: z
      .string()
      .min(2, '닉네임은 최소 2자 이상이어야 합니다')
      .max(20, '닉네임은 최대 20자까지 가능합니다')
      .regex(/^[가-힣a-zA-Z0-9]+$/, '한글, 영문, 숫자만 입력 가능합니다'),
    agreements: z.object({
      termsOfService: z.boolean().refine((val) => val === true, {
        message: '서비스 이용약관에 동의해주세요',
      }),
      privacyPolicy: z.boolean().refine((val) => val === true, {
        message: '개인정보 처리방침에 동의해주세요',
      }),
      marketing: z.boolean(),
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
