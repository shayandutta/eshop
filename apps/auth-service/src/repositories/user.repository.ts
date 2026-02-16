import prisma from '@packages/libs/prisma';

const userRepository = {
  findByEmail: (email: string) => {
    return prisma.users.findUnique({
      where: { email },
    });
  },

  create: (data: { name: string; email: string; password: string }) => {
    return prisma.users.create({
      data,
    });
  },
};

export default userRepository;