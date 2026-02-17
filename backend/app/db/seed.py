# @TASK P0-T0.4 - Database initialization: team templates seed
# @SPEC docs/planning/04-database-design.md#seed-data
"""Seed script for team templates."""
import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.team_template import TeamTemplate


TEAM_TEMPLATES = [
    {
        "name": "마케팅 팀",
        "category": "마케팅",
        "icon": "megaphone",
        "description": "블로그, SNS, 뉴스레터 콘텐츠 생성",
        "default_agents": [
            {
                "name": "콘텐츠 전략가",
                "role": "전략 수립",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "블로그 작가",
                "role": "블로그 작성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "SNS 매니저",
                "role": "SNS 콘텐츠",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "뉴스레터 편집자",
                "role": "뉴스레터 작성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "QA 리뷰어",
                "role": "품질 검수",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "재무 분석 팀",
        "category": "재무",
        "icon": "chart-bar",
        "description": "재무 데이터 분석 및 보고서 생성",
        "default_agents": [
            {
                "name": "재무 분석가",
                "role": "데이터 분석",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "리서처",
                "role": "시장 조사",
                "layer": "research",
                "model": "sonnet",
            },
            {
                "name": "보고서 작성자",
                "role": "보고서 작성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "검증자",
                "role": "수치 검증",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "전략 기획 팀",
        "category": "전략",
        "icon": "lightbulb",
        "description": "사업 전략 수립 및 시장 분석",
        "default_agents": [
            {
                "name": "전략 디렉터",
                "role": "전략 총괄",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "시장 분석가",
                "role": "시장 분석",
                "layer": "research",
                "model": "sonnet",
            },
            {
                "name": "기획서 작성자",
                "role": "기획서 작성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "리뷰어",
                "role": "품질 검토",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "교육 콘텐츠 팀",
        "category": "교육",
        "icon": "graduation-cap",
        "description": "교육 자료 및 강의 콘텐츠 생성",
        "default_agents": [
            {
                "name": "커리큘럼 설계자",
                "role": "교육 설계",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "콘텐츠 제작자",
                "role": "자료 제작",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "퀴즈 출제자",
                "role": "퀴즈 생성",
                "layer": "execution",
                "model": "haiku",
            },
            {
                "name": "검수자",
                "role": "내용 검수",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "이커머스 팀",
        "category": "이커머스",
        "icon": "shopping-cart",
        "description": "상품 설명, 리뷰 분석, 마케팅 자동화",
        "default_agents": [
            {
                "name": "이커머스 매니저",
                "role": "총괄 관리",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "상품 카피라이터",
                "role": "상품 설명",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "리뷰 분석가",
                "role": "리뷰 분석",
                "layer": "research",
                "model": "sonnet",
            },
            {
                "name": "검수자",
                "role": "품질 검토",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "고객 서비스 팀",
        "category": "고객서비스",
        "icon": "headphones",
        "description": "고객 문의 자동 응답 및 FAQ 생성",
        "default_agents": [
            {
                "name": "CS 매니저",
                "role": "응답 관리",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "FAQ 작성자",
                "role": "FAQ 생성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "응답 템플릿 생성자",
                "role": "템플릿 작성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "검수자",
                "role": "품질 검토",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "HR 팀",
        "category": "인사",
        "icon": "users",
        "description": "채용 공고, 면접 질문, 평가서 작성",
        "default_agents": [
            {
                "name": "HR 매니저",
                "role": "인사 총괄",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "채용 담당자",
                "role": "채용 공고 작성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "면접관",
                "role": "면접 질문 생성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "검수자",
                "role": "법적 검토",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "법무 팀",
        "category": "법무",
        "icon": "scale",
        "description": "계약서 검토, 법률 문서 분석",
        "default_agents": [
            {
                "name": "법률 자문",
                "role": "법률 총괄",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "계약 분석가",
                "role": "계약서 분석",
                "layer": "research",
                "model": "sonnet",
            },
            {
                "name": "문서 작성자",
                "role": "법률 문서 작성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "검수자",
                "role": "법적 검토",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "데이터 분석 팀",
        "category": "데이터",
        "icon": "database",
        "description": "데이터 분석 및 인사이트 도출",
        "default_agents": [
            {
                "name": "수석 분석가",
                "role": "분석 총괄",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "데이터 수집가",
                "role": "데이터 수집",
                "layer": "research",
                "model": "sonnet",
            },
            {
                "name": "시각화 전문가",
                "role": "차트/그래프 생성",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "검증자",
                "role": "분석 검증",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
    {
        "name": "R&D 팀",
        "category": "연구개발",
        "icon": "flask",
        "description": "기술 조사 및 프로토타입 설계",
        "default_agents": [
            {
                "name": "연구 디렉터",
                "role": "연구 총괄",
                "layer": "orchestration",
                "model": "opus",
            },
            {
                "name": "기술 리서처",
                "role": "기술 조사",
                "layer": "research",
                "model": "sonnet",
            },
            {
                "name": "프로토타이퍼",
                "role": "프로토타입 설계",
                "layer": "execution",
                "model": "sonnet",
            },
            {
                "name": "검증자",
                "role": "기술 검증",
                "layer": "quality",
                "model": "haiku",
            },
        ],
    },
]


async def seed_team_templates(session: AsyncSession):
    """Seed team templates into the database."""
    for template_data in TEAM_TEMPLATES:
        template = TeamTemplate(
            id=str(uuid.uuid4()),
            name=template_data["name"],
            category=template_data["category"],
            icon=template_data.get("icon"),
            description=template_data.get("description"),
            default_agents=template_data.get("default_agents", []),
            is_active=True,
        )
        session.add(template)
    await session.commit()
    print(f"Seeded {len(TEAM_TEMPLATES)} team templates")


async def main():
    """Run seed script."""
    async with AsyncSessionLocal() as session:
        await seed_team_templates(session)


if __name__ == "__main__":
    asyncio.run(main())
