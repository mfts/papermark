export interface FolderTemplate {
  name: string;
  subfolders?: FolderTemplate[];
}

export const DATAROOM_TEMPLATE_TYPES = [
  "startup-fundraising",
  "raising-first-fund",
  "ma-acquisition",
  "series-a-plus",
  "real-estate-transaction",
  "fund-management",
  "portfolio-management",
  "project-management",
  "sales-dataroom",
] as const;

export const DATAROOM_TEMPLATES: Record<
  string,
  { name: string; folders: FolderTemplate[] }
> = {
  "startup-fundraising": {
    name: "Startup Fundraising",
    folders: [
      { name: "Corporate or Investment Memo" },
      {
        name: "Corporate Documents",
        subfolders: [
          { name: "Company Registration" },
          { name: "Group Structure" },
          { name: "Shareholder Overview" },
        ],
      },
      {
        name: "Financial Forecast and Actuals",
        subfolders: [{ name: "Forecasts" }, { name: "Actuals" }],
      },
      {
        name: "Legal and Tax Documents",
        subfolders: [
          { name: "Contracts" },
          { name: "IP Agreements" },
          { name: "Capitalization Table" },
        ],
      },
      {
        name: "Go-to-Market and Marketing Strategy",
        subfolders: [
          { name: "Business Plan" },
          { name: "Organizational Chart" },
        ],
      },
      { name: "Product Roadmap" },
      { name: "Pitch Deck" },
    ],
  },
  "raising-first-fund": {
    name: "Raising First Fund",
    folders: [
      {
        name: "1 Introduction",
        subfolders: [{ name: "Presentations" }],
      },
      {
        name: "2 Team",
        subfolders: [{ name: "CVs & References" }],
      },
      {
        name: "3 Track Record",
        subfolders: [{ name: "Track record & portfolio references" }],
      },
      {
        name: "4 Fund Model",
        subfolders: [{ name: "XLSX granular track record" }],
      },
      {
        name: "5 Legal",
        subfolders: [{ name: "Executed LPA, bylaws" }],
      },
      {
        name: "6 Portfolio",
        subfolders: [{ name: "Investment memos of portfolio companies" }],
      },
    ],
  },
  "ma-acquisition": {
    name: "M&A / Acquisition",
    folders: [
      {
        name: "1 Executive Summary",
        subfolders: [
          { name: "Transaction Overview" },
          { name: "Investment Highlights" },
        ],
      },
      {
        name: "2 Corporate Structure & Governance",
        subfolders: [
          { name: "Corporate Documents" },
          { name: "Board Materials" },
          { name: "Shareholder Agreements" },
        ],
      },
      {
        name: "3 Financial Information",
        subfolders: [
          { name: "Historical Financials" },
          { name: "Audited Statements" },
          { name: "Management Accounts" },
          { name: "Financial Projections" },
        ],
      },
      {
        name: "4 Legal & Compliance",
        subfolders: [
          { name: "Material Contracts" },
          { name: "Litigation & Disputes" },
          { name: "Regulatory Compliance" },
          { name: "Permits & Licenses" },
        ],
      },
      {
        name: "5 Intellectual Property",
        subfolders: [
          { name: "Patents & Trademarks" },
          { name: "Licenses & Assignments" },
          { name: "IP Agreements" },
        ],
      },
      {
        name: "6 Contracts & Agreements",
        subfolders: [
          { name: "Customer Contracts" },
          { name: "Supplier Agreements" },
          { name: "Partnership Agreements" },
        ],
      },
      {
        name: "7 Human Resources",
        subfolders: [
          { name: "Employee List" },
          { name: "Employment Agreements" },
          { name: "Benefits & Compensation" },
          { name: "Organization Chart" },
        ],
      },
      {
        name: "8 Tax Documents",
        subfolders: [{ name: "Tax Returns" }, { name: "Tax Assessments" }],
      },
      {
        name: "9 Assets & Liabilities",
        subfolders: [
          { name: "Real Estate" },
          { name: "Equipment & Inventory" },
          { name: "Debt & Obligations" },
        ],
      },
      {
        name: "10 Insurance",
        subfolders: [
          { name: "Insurance Policies" },
          { name: "Claims History" },
        ],
      },
    ],
  },
  "series-a-plus": {
    name: "Series A+ Fundraising",
    folders: [
      {
        name: "1 Investment Memorandum",
        subfolders: [{ name: "Executive Summary" }, { name: "Pitch Deck" }],
      },
      {
        name: "2 Financial Information",
        subfolders: [
          { name: "Historical Financials" },
          { name: "Financial Projections" },
          { name: "Unit Economics" },
          { name: "KPI Dashboard" },
        ],
      },
      {
        name: "3 Corporate Documents",
        subfolders: [
          { name: "Incorporation Documents" },
          { name: "Board Materials" },
          { name: "Shareholder Agreements" },
        ],
      },
      {
        name: "4 Cap Table & Term Sheets",
        subfolders: [
          { name: "Capitalization Table" },
          { name: "Previous Rounds" },
          { name: "Stock Option Pool" },
        ],
      },
      {
        name: "5 Product & Technology",
        subfolders: [
          { name: "Product Roadmap" },
          { name: "Technical Documentation" },
          { name: "Product Demos" },
        ],
      },
      {
        name: "6 Market & Traction",
        subfolders: [
          { name: "Market Analysis" },
          { name: "Customer Data" },
          { name: "Growth Metrics" },
          { name: "Case Studies" },
        ],
      },
      {
        name: "7 Team & Organization",
        subfolders: [
          { name: "Team Bios" },
          { name: "Organizational Chart" },
          { name: "Advisory Board" },
          { name: "Key Hires Plan" },
        ],
      },
      {
        name: "8 Legal & IP",
        subfolders: [
          { name: "IP Portfolio" },
          { name: "Material Contracts" },
          { name: "Compliance Documents" },
        ],
      },
      {
        name: "9 Competitive Analysis",
        subfolders: [
          { name: "Competitive Landscape" },
          { name: "Differentiation" },
        ],
      },
      {
        name: "10 Use of Funds",
        subfolders: [{ name: "Budget Allocation" }, { name: "Milestones" }],
      },
    ],
  },
  "real-estate-transaction": {
    name: "Real Estate Transaction",
    folders: [
      {
        name: "1 Property Information",
        subfolders: [
          { name: "Property Overview" },
          { name: "Location & Site Plans" },
          { name: "Building Specifications" },
        ],
      },
      {
        name: "2 Title & Ownership",
        subfolders: [
          { name: "Title Documents" },
          { name: "Ownership Structure" },
          { name: "Deed & Transfer Documents" },
        ],
      },
      {
        name: "3 Legal Documents",
        subfolders: [
          { name: "Purchase Agreements" },
          { name: "Easements & Restrictions" },
          { name: "Zoning & Permits" },
        ],
      },
      {
        name: "4 Financial Information",
        subfolders: [
          { name: "Operating Statements" },
          { name: "Rent Roll" },
          { name: "Expense Reports" },
          { name: "Tax Assessments" },
        ],
      },
      {
        name: "5 Leases & Tenancies",
        subfolders: [
          { name: "Tenant Leases" },
          { name: "Tenant Correspondence" },
          { name: "Lease Abstracts" },
        ],
      },
      {
        name: "6 Property Surveys & Plans",
        subfolders: [
          { name: "Survey Reports" },
          { name: "Floor Plans" },
          { name: "As-Built Drawings" },
        ],
      },
      {
        name: "7 Environmental Reports",
        subfolders: [
          { name: "Environmental Assessments" },
          { name: "Soil Reports" },
          { name: "Remediation Documents" },
        ],
      },
      {
        name: "8 Building Inspections",
        subfolders: [
          { name: "Structural Inspections" },
          { name: "Engineering Reports" },
          { name: "Maintenance Records" },
        ],
      },
      {
        name: "9 Property Management",
        subfolders: [
          { name: "Management Agreements" },
          { name: "Vendor Contracts" },
          { name: "Service Agreements" },
        ],
      },
      {
        name: "10 Insurance & Warranties",
        subfolders: [
          { name: "Insurance Policies" },
          { name: "Warranties" },
          { name: "Claims History" },
        ],
      },
    ],
  },
  "fund-management": {
    name: "Fund Management",
    folders: [
      {
        name: "1 Fund Documents",
        subfolders: [
          { name: "Fund Formation Documents" },
          { name: "LPA & Side Letters" },
          { name: "Fund Policies" },
        ],
      },
      {
        name: "2 LP Relations",
        subfolders: [
          { name: "LP Commitments" },
          { name: "Capital Calls" },
          { name: "Distribution Notices" },
          { name: "LP Communications" },
        ],
      },
      {
        name: "3 Financial Reporting",
        subfolders: [
          { name: "Quarterly Reports" },
          { name: "Annual Reports" },
          { name: "NAV Statements" },
          { name: "Cash Flow Reports" },
        ],
      },
      {
        name: "4 Compliance & Legal",
        subfolders: [
          { name: "Regulatory Filings" },
          { name: "Audit Reports" },
          { name: "Tax Documents" },
          { name: "Legal Opinions" },
        ],
      },
      {
        name: "5 Investment Activities",
        subfolders: [
          { name: "Investment Memos" },
          { name: "Deal Pipeline" },
          { name: "Investment Committee Materials" },
        ],
      },
      {
        name: "6 Portfolio Monitoring",
        subfolders: [
          { name: "Portfolio Company Updates" },
          { name: "Board Materials" },
          { name: "Valuations" },
        ],
      },
      {
        name: "7 Operations",
        subfolders: [
          { name: "Fund Administration" },
          { name: "Service Provider Agreements" },
          { name: "Policies & Procedures" },
        ],
      },
      {
        name: "8 Investor Communications",
        subfolders: [
          { name: "Investor Letters" },
          { name: "Meeting Materials" },
          { name: "AGM Documents" },
        ],
      },
    ],
  },
  "portfolio-management": {
    name: "Portfolio Management",
    folders: [
      {
        name: "1 Portfolio Overview",
        subfolders: [
          { name: "Portfolio Summary" },
          { name: "Portfolio Strategy" },
          { name: "Performance Dashboard" },
        ],
      },
      {
        name: "2 Portfolio Companies",
        subfolders: [
          { name: "Company Profiles" },
          { name: "Investment Theses" },
          { name: "Ownership Information" },
        ],
      },
      {
        name: "3 Financial Performance",
        subfolders: [
          { name: "Company Financials" },
          { name: "KPI Reports" },
          { name: "Valuations" },
          { name: "Return Analysis" },
        ],
      },
      {
        name: "4 Board & Governance",
        subfolders: [
          { name: "Board Decks" },
          { name: "Meeting Minutes" },
          { name: "Board Observer Rights" },
        ],
      },
      {
        name: "5 Operational Support",
        subfolders: [
          { name: "Value Creation Plans" },
          { name: "Strategic Initiatives" },
          { name: "Operational Reviews" },
        ],
      },
      {
        name: "6 Deal Documents",
        subfolders: [
          { name: "Investment Agreements" },
          { name: "Shareholder Agreements" },
          { name: "Cap Tables" },
        ],
      },
      {
        name: "7 Follow-on & Exits",
        subfolders: [
          { name: "Follow-on Analysis" },
          { name: "Exit Planning" },
          { name: "M&A Materials" },
        ],
      },
      {
        name: "8 Portfolio Monitoring",
        subfolders: [
          { name: "Monthly Updates" },
          { name: "Risk Assessments" },
          { name: "Action Items" },
        ],
      },
    ],
  },
  "project-management": {
    name: "Project Management",
    folders: [
      {
        name: "1 Project Overview",
        subfolders: [
          { name: "Project Charter" },
          { name: "Scope & Objectives" },
          { name: "Project Plan" },
        ],
      },
      {
        name: "2 Requirements & Specifications",
        subfolders: [
          { name: "Requirements Documentation" },
          { name: "Technical Specifications" },
          { name: "User Stories" },
        ],
      },
      {
        name: "3 Project Planning",
        subfolders: [
          { name: "Work Breakdown Structure" },
          { name: "Timeline & Milestones" },
          { name: "Resource Plan" },
          { name: "Budget" },
        ],
      },
      {
        name: "4 Team & Stakeholders",
        subfolders: [
          { name: "Team Directory" },
          { name: "Roles & Responsibilities" },
          { name: "Stakeholder Matrix" },
        ],
      },
      {
        name: "5 Project Execution",
        subfolders: [
          { name: "Sprint Plans" },
          { name: "Task Tracking" },
          { name: "Deliverables" },
        ],
      },
      {
        name: "6 Communication",
        subfolders: [
          { name: "Status Reports" },
          { name: "Meeting Notes" },
          { name: "Stakeholder Updates" },
        ],
      },
      {
        name: "7 Risk & Issues",
        subfolders: [
          { name: "Risk Register" },
          { name: "Issue Log" },
          { name: "Change Requests" },
        ],
      },
      {
        name: "8 Quality & Testing",
        subfolders: [
          { name: "Quality Standards" },
          { name: "Test Plans" },
          { name: "Acceptance Criteria" },
        ],
      },
      {
        name: "9 Documentation",
        subfolders: [
          { name: "Process Documentation" },
          { name: "User Guides" },
          { name: "Training Materials" },
        ],
      },
      {
        name: "10 Project Closure",
        subfolders: [
          { name: "Final Reports" },
          { name: "Lessons Learned" },
          { name: "Handover Documents" },
        ],
      },
    ],
  },
  "sales-dataroom": {
    name: "Sales Data Room",
    folders: [
      {
        name: "1 Sales Materials",
        subfolders: [
          { name: "Sales Decks" },
          { name: "Product Brochures" },
          { name: "One Pagers" },
        ],
      },
      {
        name: "2 Proposals & Quotes",
        subfolders: [{ name: "Proposals" }, { name: "Pricing" }],
      },
      {
        name: "3 Contracts & Agreements",
        subfolders: [
          { name: "Master Service Agreements" },
          { name: "NDAs" },
          { name: "Terms & Conditions" },
        ],
      },
      {
        name: "4 Product Information",
        subfolders: [
          { name: "Product Specs" },
          { name: "Demo Videos" },
          { name: "Case Studies" },
        ],
      },
      {
        name: "5 Customer References",
        subfolders: [{ name: "Testimonials" }, { name: "Reference Letters" }],
      },
      {
        name: "6 Security & Compliance",
        subfolders: [
          { name: "Security Documentation" },
          { name: "Compliance Certificates" },
          { name: "Insurance Certificates" },
        ],
      },
    ],
  },
};
