package com.github.ahnshy.weblotto.controller;

import com.github.ahnshy.weblotto.domain.SyncLogic;
import com.github.ahnshy.weblotto.model.Repository.LotteryRepository;
import com.github.ahnshy.weblotto.model.entity.Lottery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api") // %SERVER_URL%:8080/api
public class SyncController {

    @Autowired
    private LotteryRepository lotteryRepository;

    @GetMapping("/empty") // %SERVER_URL%:8080/api/sync
    public  String setEmpty() {
        // to do...
        return  "Repository Set Empty Seuccess.";
    }

    @GetMapping("/sync") // %SERVER_URL%:8080/api/sync
    public List<Lottery> list() {
        // to do...
        return null;
    }
}
