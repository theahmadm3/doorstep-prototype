
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  const {email} = await req.json();

  let role = 'customer'; // Default role

  if (email.includes('admin')) {
    role = 'admin';
  } else if (email.includes('vendor')) {
    role = 'vendor';
  } else if (email.includes('rider')) {
    role = 'rider';
  }

  // This is a mock response. In a real application, you would validate
  // the credentials against a database and generate a real JWT.
  return NextResponse.json({
    message: 'Login successful',
    role: role,
    user: {
      id: 'mock-user-id',
      full_name: 'Mock User',
      email: email,
      phone_number: '123-456-7890',
      role: role,
      status: 'Active',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    access: 'mock-access-token',
  });
}
