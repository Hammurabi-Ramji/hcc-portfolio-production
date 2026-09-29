import { NextRequest, NextResponse } from 'next/server';

// Mock users database (use real database in production)
const users = new Map([
  [
    'user1',
    {
      id: 'user1',
      email: 'alice@example.com',
      username: 'alice',
      role: 'user' as const,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
    },
  ],
  [
    'user2',
    {
      id: 'user2',
      email: 'bob@example.com',
      username: 'bob',
      role: 'admin' as const,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date(),
    },
  ],
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Filter users
    let filteredUsers = Array.from(users.values());

    if (search) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.username.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Calculate pagination
    const total = filteredUsers.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);

    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        meta: {
          page,
          limit,
          total,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIST_USERS_FAILED',
          message: 'Failed to list users',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, username, and password are required',
          },
        },
        { status: 400 }
      );
    }

    // Check if user exists
    if (Array.from(users.values()).some((u) => u.email === email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create new user
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      email,
      username,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.set(userId, newUser);

    return NextResponse.json(
      {
        success: true,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_USER_FAILED',
          message: 'Failed to create user',
        },
      },
      { status: 500 }
    );
  }
}
