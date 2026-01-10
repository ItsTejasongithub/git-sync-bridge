const API_BASE_URL = 'http://localhost:3001/api';

export const aiReportApi = {
  async generateReport(params: { logId?: number; uniqueId?: string; reportId?: string; summary?: any; trades?: any[] }): Promise<{
    success: boolean;
    report?: string;
    message?: string;
  }> {
    try {
      const body: any = {};
      if (params.uniqueId) body.uniqueId = params.uniqueId;
      if (params.logId !== undefined) body.logId = params.logId;
      if (params.reportId) body.reportId = params.reportId;
      if (params.summary) body.summary = params.summary;
      if (params.trades) body.trades = params.trades;

      const response = await fetch(`${API_BASE_URL}/ai-report/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch (err) {
        return { success: false, message: `HTTP ${response.status} ${response.statusText}` };
      }

      if (!response.ok) {
        return { success: false, message: data.message || `HTTP ${response.status}` };
      }

      return data;
    } catch (error: any) {
      console.error('AI Report API error:', error);
      return {
        success: false,
        message: error.message || 'Network error',
      };
    }
  },
};
