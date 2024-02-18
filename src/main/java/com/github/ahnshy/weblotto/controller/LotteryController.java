package com.github.ahnshy.weblotto.controller;

import com.github.ahnshy.weblotto.model.Repository.LotteryRepository;
import com.github.ahnshy.weblotto.model.entity.Lottery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin
@RestController
@RequestMapping("/api") // %SERVER_URL%:8080/api
public class LotteryController {

    @Autowired
    private LotteryRepository lotteryRepository;

    @GetMapping("/lottery") // %SERVER_URL%:8080/api/lottery
    public List<Lottery> list() {
        List<Lottery> list = lotteryRepository.findAll();
        return list;
    }
}
