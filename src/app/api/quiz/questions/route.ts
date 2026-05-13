import { NextResponse } from 'next/server';
import { query } from '@/lib/server/mysql';

export async function GET() {
  try {
    const questions = await query<any[]>(`
      SELECT 
        q.id as question_id,
        q.question_text,
        q.question_type,
        o.id as option_id,
        o.option_text,
        o.option_desc,
        o.icon_name
      FROM quiz_questions q
      JOIN quiz_options o ON q.id = o.question_id
      ORDER BY q.order_index ASC, o.id ASC
    `);

    // Group by question
    const grouped = questions.reduce((acc: any[], curr) => {
      let q = acc.find(item => item.id === curr.question_id);
      if (!q) {
        q = {
          id: curr.question_id,
          title: curr.question_text,
          type: curr.question_type,
          options: []
        };
        acc.push(q);
      }
      q.options.push({
        id: curr.option_id,
        title: curr.option_text,
        desc: curr.option_desc,
        icon: curr.icon_name
      });
      return acc;
    }, []);

    return NextResponse.json({ questions: grouped });
  } catch (error) {
    console.error('Fetch quiz questions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
