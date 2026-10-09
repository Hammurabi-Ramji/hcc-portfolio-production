import { NextRequest, NextResponse } from 'next/server';

// Mock projects database
const projects = new Map([
  [
    'project1',
    {
      id: 'project1',
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce application',
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      createdBy: 'user1',
    },
  ],
  [
    'project2',
    {
      id: 'project2',
      name: 'Task Manager',
      description: 'Project management application',
      status: 'completed',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
      createdBy: 'user1',
    },
  ],
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Filter projects
    let filteredProjects = Array.from(projects.values());

    if (status) {
      filteredProjects = filteredProjects.filter((p) => p.status === status);
    }

    if (search) {
      filteredProjects = filteredProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Calculate pagination
    const total = filteredProjects.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);

    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        projects: paginatedProjects,
        meta: {
          page,
          limit,
          total,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIST_PROJECTS_FAILED',
          message: 'Failed to list projects',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, status } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Project name is required',
          },
        },
        { status: 400 }
      );
    }

    // Create new project
    const projectId = `project_${Date.now()}`;
    const newProject = {
      id: projectId,
      name,
      description,
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user1', // Get from auth in production
    };

    projects.set(projectId, newProject);

    return NextResponse.json(
      {
        success: true,
        data: newProject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_PROJECT_FAILED',
          message: 'Failed to create project',
        },
      },
      { status: 500 }
    );
  }
}
