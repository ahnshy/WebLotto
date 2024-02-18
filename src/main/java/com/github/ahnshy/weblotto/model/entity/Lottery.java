package com.github.ahnshy.weblotto.model.entity;

import javax.persistence.*;

import lombok.*;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="tb_lottery_history")   // class와 TB name이 달라서
@Getter
@Entity
@Builder
public class Lottery {

    //@GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long round;

    private LocalDate eventDate;

    //@Column(name = "win_no_1", nullable = false, length = 3)
    private int winNo1;

    private int winNo2;

    private int winNo3;

    private int winNo4;

    private int winNo5;

    private int winNo6;

    //@Column(name = "bonus_no")
    private int bonusNo;

    //@Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createAt;

    @PrePersist
    public void prePersist() {
        this.createAt = LocalDateTime.now();
    }

    public String toStringWinNo() {
        return  Integer.toString(winNo1) +
                Integer.toString(winNo2) +
                Integer.toString(winNo3) +
                Integer.toString(winNo4) +
                Integer.toString(winNo5) +
                Integer.toString(winNo6) +
                " BonusNo : " +
                Integer.toString(bonusNo);
    }
}
