package com.github.ahnshy.weblotto.domain;

import com.github.ahnshy.weblotto.Util.ExcelUtil;
import com.github.ahnshy.weblotto.Util.HttpHelper;
import com.github.ahnshy.weblotto.model.entity.Lottery;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.List;

public class SyncLogic {

    public List<Lottery> syncLottery() {
//        try {
//            String fileName = downloadLottery();
//            ExcelUtil excel = new ExcelUtil();
//            List<Lottery> list =  excel.parseToList(fileName);
//            return  true;
//
//        } catch (IOException e) {
//            throw new RuntimeException(e);
//        }

        // to do ....
        final String fileName = "";
        ExcelUtil excel = new ExcelUtil();
        return excel.parseToListEx(fileName);
    }

    private String downloadLottery() throws IOException {

        // to do ....
        final String fileName = "";
        return fileName;
    }
}
