from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO
from datetime import datetime, timedelta
from typing import List, Optional
from app.models.admin.transaction import Transaction

def generate_financial_report_pdf(
    transactions: List[Transaction],
    report_type: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    stats: dict = None
) -> BytesIO:
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a5490'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=12,
    )
    
    title = Paragraph(f"CricBee Financial Report - {report_type.title()}", title_style)
    elements.append(title)
    
    date_range = ""
    if start_date and end_date:
        date_range = f"{start_date.strftime('%d %b %Y')} to {end_date.strftime('%d %b %Y')}"
    elif start_date:
        date_range = f"From {start_date.strftime('%d %b %Y')}"
    elif end_date:
        date_range = f"Until {end_date.strftime('%d %b %Y')}"
    
    if date_range:
        date_para = Paragraph(f"<para align=center>{date_range}</para>", styles['Normal'])
        elements.append(date_para)
    
    elements.append(Spacer(1, 20))
    
    if stats:
        summary_heading = Paragraph("Financial Summary", heading_style)
        elements.append(summary_heading)
        
        summary_data = [
            ['Metric', 'Amount (₹)'],
            ['Total Revenue', f"₹{stats.get('total_revenue', 0):,.2f}"],
            ['Total Debits', f"₹{stats.get('total_debits', 0):,.2f}"],
            ['Net Balance', f"₹{stats.get('net_balance', 0):,.2f}"],
            ['Total Transactions', str(stats.get('total_transactions', 0))]
        ]
        
        summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 30))
    
    transactions_heading = Paragraph("Transaction Details", heading_style)
    elements.append(transactions_heading)
    elements.append(Spacer(1, 10))
    
    if transactions:
        table_data = [['Date', 'Transaction ID', 'Tournament', 'User', 'Type', 'Direction', 'Amount (₹)', 'Status']]
        
        for txn in transactions:
            user = txn.organizer or txn.club_manager
            table_data.append([
                txn.created_at.strftime('%d-%m-%Y %H:%M'),
                txn.transaction_id[:15] + '...' if len(txn.transaction_id) > 15 else txn.transaction_id,
                (txn.tournament.tournament_name[:15] + '...' if len(txn.tournament.tournament_name) > 15 else txn.tournament.tournament_name) if txn.tournament else '-',
                (user.full_name[:12] + '...' if len(user.full_name) > 12 else user.full_name) if user else '-',
                txn.transaction_type.replace('_', ' ').title(),
                '↑ Credit' if txn.transaction_direction == 'credit' else '↓ Debit',
                f"₹{float(txn.amount):,.2f}",
                txn.status.title()
            ])
        
        col_widths = [0.9*inch, 1.2*inch, 1.2*inch, 1.0*inch, 1.1*inch, 0.7*inch, 0.9*inch, 0.7*inch]
        transactions_table = Table(table_data, colWidths=col_widths)
        
        transactions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5490')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        elements.append(transactions_table)
    else:
        no_data = Paragraph("<para align=center>No transactions found for this period</para>", styles['Normal'])
        elements.append(no_data)
    
    elements.append(Spacer(1, 30))
    footer = Paragraph(
        f"<para align=center>Generated on {datetime.now().strftime('%d %B %Y at %H:%M:%S')}</para>",
        styles['Italic']
    )
    elements.append(footer)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

def calculate_date_range(report_type: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None):
    
    now = datetime.now()
    
    if report_type == "weekly":
        start_date = now - timedelta(days=7)
        end_date = now
    elif report_type == "monthly":
        start_date = now - timedelta(days=30)
        end_date = now
    elif report_type == "yearly":
        start_date = now - timedelta(days=365)
        end_date = now
    elif report_type == "custom":
        if not custom_start or not custom_end:
            raise ValueError("Custom date range requires both start_date and end_date")
        start_date = datetime.fromisoformat(custom_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(custom_end.replace('Z', '+00:00'))
    else:
        raise ValueError("Invalid report type. Must be 'weekly', 'monthly', 'yearly', or 'custom'")
    
    return start_date, end_date
