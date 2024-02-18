package com.github.ahnshy.weblotto.Util;

import com.github.ahnshy.weblotto.model.entity.Lottery;
import jxl.Cell;
import jxl.Sheet;
import jxl.Workbook;
import jxl.read.biff.BiffException;
//import org.apache.poi.hssf.usermodel.HSSFCell;
//import org.apache.poi.hssf.usermodel.HSSFRow;
//import org.apache.poi.hssf.usermodel.HSSFSheet;
//import org.apache.poi.hssf.usermodel.HSSFWorkbook;
//import org.apache.poi.ss.usermodel.DataFormatter;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

public class ExcelUtil {

    public List<Lottery> parseToListEx(String fileName) {
        //HashMap<Long, Lottery> excelData = new HashMap<>();
        //File file = new File(fileName);
        //if (!isExcel(file))
        //   return excelData;

        List<Lottery> list = new LinkedList<>();
        StringBuffer cellData = new StringBuffer();

        Lottery vo;

        File file = new File(fileName);
        try {
            Workbook workbook = Workbook.getWorkbook(file);
            Sheet sheet = workbook.getSheet(0);

            //데이터 생성및 구분자 삽입 col=>[xxx] / row=>\n
            for (int i=3; i<sheet.getRows(); i++ )
            {
                vo = new Lottery();
                vo.setCreateAt(LocalDateTime.now());
                for (int j=1; j<sheet.getColumns(); j++ )
                {
                    Cell cell = sheet.getCell(j,i);
                    //cellData.append("["+cell.getContents().trim()+"]");
                    if (j == 1)
                        vo.setRound(Long.parseLong(cell.getContents().trim()));
                    else if (j == 2) {
                        //vo.setEventDate(LocalDate.parse(cell.getContents().trim(), DateTimeFormatter.ISO_DATE));
                        String[] parseStr = cell.getContents().trim().split("\\.");
                        vo.setEventDate(LocalDate.of(Integer.parseInt(parseStr[0]), Integer.parseInt(parseStr[1]), Integer.parseInt(parseStr[2])));
                    }
                    else if (j == 13)
                        vo.setWinNo1(Integer.parseInt(cell.getContents().trim()));
                    else if (j == 14)
                        vo.setWinNo2(Integer.parseInt(cell.getContents().trim()));
                    else if (j == 15)
                        vo.setWinNo3(Integer.parseInt(cell.getContents().trim()));
                    else if (j == 16)
                        vo.setWinNo4(Integer.parseInt(cell.getContents().trim()));
                    else if (j == 17)
                        vo.setWinNo5(Integer.parseInt(cell.getContents().trim()));
                    else if (j == 18)
                        vo.setWinNo6(Integer.parseInt(cell.getContents().trim()));
                    else if (j == 19)
                        vo.setBonusNo(Integer.parseInt(cell.getContents().trim()));
                }
                //cellData.append("\n");
                list.add(vo);
            }
            workbook.close();

            System.out.println(cellData.toString());
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (BiffException e) {
            throw new RuntimeException(e);
        }

        return  list;
    }

    public List<Lottery> parseToList(String fileName) {

        List<Lottery> list = new LinkedList<>();
//        FileInputStream fis = null;
//        HSSFWorkbook workbook = null;
//
//        try {
//
//            fis= new FileInputStream(fileName);
//            // HSSFWorkbook은 엑셀파일 전체 내용을 담고 있는 객체
//            workbook = new HSSFWorkbook(fis);
//
//            // 탐색에 사용할 Sheet, Row, Cell 객체
//            HSSFSheet curSheet;
//            HSSFRow curRow;
//            HSSFCell curCell;
//            Lottery vo;
//
//            // Sheet 탐색 for문
//            for(int sheetIndex = 0 ; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
//                // 현재 Sheet 반환
//                curSheet = workbook.getSheetAt(sheetIndex);
//                // row 탐색 for문
//                for(int rowIndex=4; rowIndex < curSheet.getPhysicalNumberOfRows(); rowIndex++) {
//                    // row 0은 헤더정보이기 때문에 무시
//                    if(rowIndex != 0) {
//                        // 현재 row 반환
//                        curRow = curSheet.getRow(rowIndex);
//                        vo = new Lottery();
//                        String value;
//
//                        // row의 첫번째 cell값이 비어있지 않은 경우 만 cell탐색
//                        if(!"".equals(curRow.getCell(1).getStringCellValue())) {
//
//                            // cell 탐색 for 문
//                            for(int cellIndex=0;cellIndex<curRow.getPhysicalNumberOfCells(); cellIndex++) {
//                                curCell = curRow.getCell(cellIndex);
//
//                                if(true) {
//                                    value = "";
//                                    // cell 스타일이 다르더라도 String으로 반환 받음
//                                    switch (curCell.getCellType()){
//                                        //case FORMULA:
//                                            //value = curCell.getCellFormula().toString();
//                                         //   break;
//                                        case NUMERIC:
//                                            //value =Double.toString(curCell.getNumericCellValue());
//                                            //DataFormatter formatter = new DataFormatter();
//                                            //String s = formatter.formatCellValue(row.getCell(1));
//                                            //value = String.valueOf(curCell.getNumericCellValue());
//                                            value = Integer.toString((int)curCell.getNumericCellValue());
//                                            break;
//                                        case STRING:
//                                            //value = curCell.getStringCellValue();
//                                            value = curCell.getStringCellValue();
//                                            break;
//                                        //case BLANK:
//                                            //value = curCell.getStringCellValue();
//                                            //value = curCell.getBooleanCellValue()+"";
//                                          //  break;
//                                        case ERROR:
//                                            //value = curCell.getStringCellValue();
//                                            value = curCell.getErrorCellValue()+"";
//                                            break;
//                                        default:
//                                            value = new String();
//                                            break;
//                                    }
//
//                                    System.out.println( cellIndex + " index : " + value);
//                                    // 현재 column index에 따라서 vo에 입력
////                                    switch (cellIndex) {
////                                        case 0: // 아이디
////                                            //vo.setCustId(value);;
////                                            break;
////
////                                        case 1: // 이름
////                                            //vo.setCustName(value);;
////                                            break;
////
////                                        case 2: // 나이
////                                            //vo.setCustAge(value);
////                                            break;
////
////                                        case 3: // 이메일
////                                            //vo.setCustEmail(value);
////                                            break;
////
////                                        default:
////                                            break;
////                                    }
//                                }
//                            }
//                            // cell 탐색 이후 vo 추가
//                            list.add(vo);
//                        }
//                    }
//                }
//            }
//        } catch (FileNotFoundException e) {
//            // TODO
//            e.printStackTrace();
//        } catch (IOException e) {
//            // TODO
//            e.printStackTrace();
//
//        } finally {
//            try {
//                if( workbook!= null) workbook.close();
//                if( fis!= null) fis.close();
//
//            } catch (IOException e) {
//                // TODO
//                e.printStackTrace();
//            }
//        }
        return list;
    }

//    public boolean isExcel(File file) {
//        if (!file.exists() || !file.isFile())
//            return  false;
//
//        StringTokenizer st = new StringTokenizer(file.getName(), ".");
//        String xls = null;
//
//        while(st.hasMoreTokens())
//           xls = st.nextToken();
//
//        assert xls != null;
//        return xls.equals("xls") || xls.equals("xlsx");
//    }
}
