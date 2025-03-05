import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    
    return NextResponse.json({
      title: feed.title,
      description: feed.description,
      items: feed.items.map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        creator: item.creator,
        content: item.content,
        contentSnippet: item.contentSnippet,
        categories: item.categories || [],
      }))
    });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return NextResponse.json({ error: 'Failed to fetch or parse RSS feed' }, { status: 500 });
  }
}