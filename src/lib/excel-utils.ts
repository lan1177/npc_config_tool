import * as XLSX from 'xlsx';

export interface NPC {
  id: string;
  编号: string;
  名称: string;
  // ... 其他字段
}

export interface Battle {
  id: string;
  name: string;
  slots: (string | null)[];
}

export interface ProjectData {
  activityName: string;
  activityId: string;
  npcs: NPC[];
  battles: Battle[];
}

export const handleExcelImport = async (file: File): Promise<ProjectData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 读取 NPC 表
        const npcSheet = workbook.Sheets['NPC'];
        const npcs = XLSX.utils.sheet_to_json<NPC>(npcSheet);
        
        // 读取战斗表
        const battleSheet = workbook.Sheets['战斗'];
        const battles = XLSX.utils.sheet_to_json<Battle>(battleSheet);
        
        // 读取项目信息
        const projectSheet = workbook.Sheets['项目信息'];
        const projectInfo = XLSX.utils.sheet_to_json<any>(projectSheet)[0];
        
        resolve({
          activityName: projectInfo.activityName,
          activityId: projectInfo.activityId,
          npcs,
          battles
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const handleExcelExport = (data: ProjectData): void => {
  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  
  // 创建 NPC 表
  const npcSheet = XLSX.utils.json_to_sheet(data.npcs);
  XLSX.utils.book_append_sheet(workbook, npcSheet, 'NPC');
  
  // 创建战斗表
  const battleSheet = XLSX.utils.json_to_sheet(data.battles);
  XLSX.utils.book_append_sheet(workbook, battleSheet, '战斗');
  
  // 创建项目信息表
  const projectInfo = [{
    activityName: data.activityName,
    activityId: data.activityId
  }];
  const projectSheet = XLSX.utils.json_to_sheet(projectInfo);
  XLSX.utils.book_append_sheet(workbook, projectSheet, '项目信息');
  
  // 导出文件
  XLSX.writeFile(workbook, `${data.activityName}_配置表.xlsx`);
}; 