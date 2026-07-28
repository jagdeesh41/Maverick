package com.example.bankchain.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * One row = one holder's current position in one asset. This is what
 * makes partial transfers real: transferring 20 of your 100 units
 * decrements THIS row by 20 and creates/increments a separate row for
 * the buyer - your remaining 80 is just this same row, untouched.
 *
 * A holding with unitsHeld == 0 is deleted rather than kept around.
 */
@Entity
@Table(name = "asset_holdings", uniqueConstraints = @UniqueConstraint(columnNames = {"asset_id", "holder_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetHolding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    private Asset asset;

    @ManyToOne
    @JoinColumn(name = "holder_id", nullable = false)
    private User holder;

    @Column(nullable = false)
    private Integer unitsHeld;
}
